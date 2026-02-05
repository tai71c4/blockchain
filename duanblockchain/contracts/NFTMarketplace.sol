// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTMarketplace is ERC721, ERC721Enumerable, ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;
    
    uint256 public listingPrice = 0.025 ether;
    uint256 public royaltyPercentage = 250; // 2.5%
    
    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
        string category;
        uint256 createdAt;
        bool isAuction;
        uint256 endTime;
        uint256 highestBid;
        address payable highestBidder;
        address payable creator;
    }
    
    mapping(uint256 => MarketItem) private idToMarketItem;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => mapping(address => uint256)) public auctionBids;
    
    event MarketItemCreated(
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold,
        string category,
        bool isAuction
    );
    
    event MarketItemSold(
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price
    );
    
    event AuctionStarted(
        uint256 indexed tokenId,
        address seller,
        uint256 startPrice,
        uint256 endTime
    );
    
    event BidPlaced(
        uint256 indexed tokenId,
        address bidder,
        uint256 amount
    );
    
    event AuctionEnded(
        uint256 indexed tokenId,
        address winner,
        uint256 amount
    );
    
    constructor() ERC721("CronosNFT", "CNFT") {}
    
    function mint(string memory tokenURI) public returns (uint256) {
        require(bytes(tokenURI).length > 0, "Token URI cannot be empty");
        require(bytes(tokenURI).length <= 500, "Token URI too long");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        idToMarketItem[newTokenId] = MarketItem(
            newTokenId,
            payable(address(0)),
            payable(msg.sender),
            0,
            false,
            "",
            block.timestamp,
            false,
            0,
            0,
            payable(address(0)),
            payable(msg.sender)
        );
        
        return newTokenId;
    }
    
    function listForSale(
        uint256 tokenId,
        uint256 price,
        string memory category
    ) public payable nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Only owner can list");
        require(price > 0, "Price must be greater than 0");
        require(msg.value == listingPrice, "Must pay listing price");
        
        _transfer(msg.sender, address(this), tokenId);
        
        idToMarketItem[tokenId].seller = payable(msg.sender);
        idToMarketItem[tokenId].owner = payable(address(this));
        idToMarketItem[tokenId].price = price;
        idToMarketItem[tokenId].sold = false;
        idToMarketItem[tokenId].category = category;
        idToMarketItem[tokenId].isAuction = false;
        
        emit MarketItemCreated(
            tokenId,
            msg.sender,
            address(this),
            price,
            false,
            category,
            false
        );
    }
    
    function startAuction(
        uint256 tokenId,
        uint256 startPrice,
        uint256 duration,
        string memory category
    ) public payable nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Only owner can start auction");
        require(startPrice > 0, "Start price must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(msg.value == listingPrice, "Must pay listing price");
        
        _transfer(msg.sender, address(this), tokenId);
        
        idToMarketItem[tokenId].seller = payable(msg.sender);
        idToMarketItem[tokenId].owner = payable(address(this));
        idToMarketItem[tokenId].price = startPrice;
        idToMarketItem[tokenId].sold = false;
        idToMarketItem[tokenId].category = category;
        idToMarketItem[tokenId].isAuction = true;
        idToMarketItem[tokenId].endTime = block.timestamp + duration;
        idToMarketItem[tokenId].highestBid = 0;
        idToMarketItem[tokenId].highestBidder = payable(address(0));
        
        emit AuctionStarted(
            tokenId,
            msg.sender,
            startPrice,
            block.timestamp + duration
        );
    }
    
    function placeBid(uint256 tokenId) public payable nonReentrant {
        MarketItem storage item = idToMarketItem[tokenId];
        require(item.isAuction, "Item is not on auction");
        require(block.timestamp < item.endTime, "Auction has ended");
        require(msg.value > item.highestBid, "Bid must be higher than current highest");
        require(msg.sender != item.seller, "Seller cannot bid");
        
        // Refund previous highest bidder
        if (item.highestBidder != address(0)) {
            item.highestBidder.transfer(item.highestBid);
        }
        
        item.highestBid = msg.value;
        item.highestBidder = payable(msg.sender);
        auctionBids[tokenId][msg.sender] = msg.value;
        
        emit BidPlaced(tokenId, msg.sender, msg.value);
    }
    
    function endAuction(uint256 tokenId) public nonReentrant {
        MarketItem storage item = idToMarketItem[tokenId];
        require(item.isAuction, "Item is not on auction");
        require(block.timestamp >= item.endTime, "Auction has not ended yet");
        require(!item.sold, "Auction already ended");
        
        item.sold = true;
        _itemsSold.increment();
        
        if (item.highestBidder != address(0)) {
            // Transfer NFT to highest bidder
            _transfer(address(this), item.highestBidder, tokenId);
            item.owner = item.highestBidder;
            
            // Calculate royalty
            uint256 royalty = (item.highestBid * royaltyPercentage) / 10000;
            uint256 sellerAmount = item.highestBid - royalty;
            
            // Transfer payments
            item.seller.transfer(sellerAmount);
            if (royalty > 0) {
                item.creator.transfer(royalty);
            }
            
            emit AuctionEnded(tokenId, item.highestBidder, item.highestBid);
            emit MarketItemSold(tokenId, item.seller, item.highestBidder, item.highestBid);
        } else {
            // No bids, return NFT to seller
            _transfer(address(this), item.seller, tokenId);
            item.owner = item.seller;
        }
    }
    
    function createMarketSale(uint256 tokenId) public payable nonReentrant {
        MarketItem storage item = idToMarketItem[tokenId];
        require(!item.isAuction, "Item is on auction");
        require(msg.value == item.price, "Please submit the asking price");
        require(!item.sold, "Item already sold");
        
        item.sold = true;
        item.owner = payable(msg.sender);
        _itemsSold.increment();
        
        _transfer(address(this), msg.sender, tokenId);
        
        // Calculate royalty
        uint256 royalty = (msg.value * royaltyPercentage) / 10000;
        uint256 sellerAmount = msg.value - royalty;
        
        // Transfer payments
        item.seller.transfer(sellerAmount);
        if (royalty > 0) {
            item.creator.transfer(royalty);
        }
        
        emit MarketItemSold(tokenId, item.seller, msg.sender, msg.value);
    }
    
    function cancelListing(uint256 tokenId) public nonReentrant {
        MarketItem storage item = idToMarketItem[tokenId];
        require(item.seller == msg.sender, "Only seller can cancel");
        require(!item.sold, "Item already sold");
        
        if (item.isAuction) {
            require(block.timestamp < item.endTime, "Cannot cancel ended auction");
            // Refund highest bidder if exists
            if (item.highestBidder != address(0)) {
                item.highestBidder.transfer(item.highestBid);
            }
        }
        
        _transfer(address(this), msg.sender, tokenId);
        item.owner = payable(msg.sender);
        item.seller = payable(address(0));
        item.price = 0;
        item.isAuction = false;
        item.endTime = 0;
        item.highestBid = 0;
        item.highestBidder = payable(address(0));
    }
    
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint itemCount = _tokenIds.current();
        uint unsoldItemCount = _tokenIds.current() - _itemsSold.current();
        uint currentIndex = 0;
        
        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        for (uint i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].owner == address(this)) {
                uint currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
    
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        
        // Count items owned by msg.sender
        for (uint i = 0; i < totalItemCount; i++) {
            uint tokenId = i + 1;
            if (ownerOf(tokenId) == msg.sender) {
                itemCount += 1;
            }
        }
        
        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            uint tokenId = i + 1;
            if (ownerOf(tokenId) == msg.sender) {
                MarketItem storage currentItem = idToMarketItem[tokenId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
    
    function fetchItemsListed() public view returns (MarketItem[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }
        
        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                uint currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenURIs[tokenId];
    }
    
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        require(_exists(tokenId), "Token does not exist");
        _tokenURIs[tokenId] = _tokenURI;
    }
    
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    function updateListingPrice(uint256 _listingPrice) public onlyOwner {
        listingPrice = _listingPrice;
    }
    
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }
    
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}
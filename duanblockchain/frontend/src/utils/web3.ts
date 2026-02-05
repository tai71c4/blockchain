import { ethers } from 'ethers';

export const CRONOS_TESTNET_CONFIG = {
  chainId: '0x152', // 338 in hex
  chainName: 'Cronos Testnet',
  nativeCurrency: {
    name: 'TCRO',
    symbol: 'TCRO',
    decimals: 18,
  },
  rpcUrls: ['https://evm-t3.cronos.org'],
  blockExplorerUrls: ['https://testnet.cronoscan.com/'],
};

export const CONTRACT_ADDRESS = '0xd1F56c851bE795AEa85eCE4A58B7c0220FfeF215';

export const connectWallet = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Check if we're on the correct network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (chainId !== CRONOS_TESTNET_CONFIG.chainId) {
        try {
          // Try to switch to Cronos Testnet
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CRONOS_TESTNET_CONFIG.chainId }],
          });
        } catch (switchError: any) {
          // If the network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [CRONOS_TESTNET_CONFIG],
            });
          } else {
            throw switchError;
          }
        }
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      
      return {
        provider,
        signer,
        address,
        balance: ethers.utils.formatEther(balance),
      };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  } else {
    throw new Error('MetaMask is not installed');
  }
};

export const getContract = (provider: ethers.providers.Web3Provider) => {
  const contractABI = [
    "function mint(string memory tokenURI) public returns (uint256)",
    "function listForSale(uint256 tokenId, uint256 price, string memory category) public payable",
    "function startAuction(uint256 tokenId, uint256 startPrice, uint256 duration, string memory category) public payable",
    "function placeBid(uint256 tokenId) public payable",
    "function endAuction(uint256 tokenId) public",
    "function createMarketSale(uint256 tokenId) public payable",
    "function cancelListing(uint256 tokenId) public",
    "function fetchMarketItems() public view returns (tuple(uint256 tokenId, address seller, address owner, uint256 price, bool sold, string category, uint256 createdAt, bool isAuction, uint256 endTime, uint256 highestBid, address highestBidder, address creator)[])",
    "function fetchMyNFTs() public view returns (tuple(uint256 tokenId, address seller, address owner, uint256 price, bool sold, string category, uint256 createdAt, bool isAuction, uint256 endTime, uint256 highestBid, address highestBidder, address creator)[])",
    "function fetchItemsListed() public view returns (tuple(uint256 tokenId, address seller, address owner, uint256 price, bool sold, string category, uint256 createdAt, bool isAuction, uint256 endTime, uint256 highestBid, address highestBidder, address creator)[])",
    "function tokenURI(uint256 tokenId) public view returns (string memory)",
    "function getListingPrice() public view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event MarketItemCreated(uint256 indexed tokenId, address seller, address owner, uint256 price, bool sold, string category, bool isAuction)"
  ];
  
  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
};

export const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatPrice = (price: string) => {
  return parseFloat(ethers.utils.formatEther(price)).toFixed(4);
};

export const parsePrice = (price: string) => {
  return ethers.utils.parseEther(price);
};
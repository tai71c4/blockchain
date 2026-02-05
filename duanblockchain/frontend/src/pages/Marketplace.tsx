import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { getContract, formatPrice } from '../utils/web3';

interface MarketItem {
  tokenId: string;
  seller: string;
  owner: string;
  price: string;
  sold: boolean;
  category: string;
  createdAt: string;
  isAuction: boolean;
  endTime: string;
  highestBid: string;
  highestBidder: string;
  creator: string;
}

interface WalletState {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  address: string;
  balance: string;
  connected: boolean;
}

interface MarketplaceProps {
  wallet: WalletState;
}

const CATEGORIES = ['Tất cả', 'Nghệ thuật', 'Âm nhạc', 'Game', 'Thể thao', 'Chụp ảnh', 'Sưu tập'];

const Marketplace: React.FC<MarketplaceProps> = ({ wallet }) => {
  const [nfts, setNfts] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [nftMetadata, setNftMetadata] = useState<{[key: string]: any}>({});

  useEffect(() => {
    loadNFTs();
  }, [wallet.provider]);

  const loadNFTs = async () => {
    if (!wallet.provider) return;
    
    try {
      setLoading(true);
      const contract = getContract(wallet.provider);
      const data = await contract.fetchMarketItems();
      
      const items = await Promise.all(data.map(async (item: any) => {
        try {
          const tokenUri = await contract.tokenURI(item.tokenId);
          const meta = await fetch(tokenUri).then(res => res.json());
          setNftMetadata(prev => ({
            ...prev,
            [item.tokenId.toString()]: meta
          }));
          
          return {
            tokenId: item.tokenId.toString(),
            seller: item.seller,
            owner: item.owner,
            price: item.price.toString(),
            sold: item.sold,
            category: item.category,
            createdAt: item.createdAt.toString(),
            isAuction: item.isAuction,
            endTime: item.endTime.toString(),
            highestBid: item.highestBid.toString(),
            highestBidder: item.highestBidder,
            creator: item.creator,
          };
        } catch (error) {
          console.error('Error loading NFT metadata:', error);
          return null;
        }
      }));
      
      setNfts(items.filter(item => item !== null) as MarketItem[]);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const buyNFT = async (tokenId: string, price: string) => {
    if (!wallet.provider || !wallet.connected) {
      alert('Please connect your wallet');
      return;
    }

    try {
      const contract = getContract(wallet.provider);
      const transaction = await contract.createMarketSale(tokenId, {
        value: price
      });
      
      await transaction.wait();
      alert('Mua NFT thành công!');
      loadNFTs();
    } catch (error: any) {
      console.error('Error buying NFT:', error);
      alert(error.message || 'Mua NFT thất bại');
    }
  };

  const placeBid = async (tokenId: string, bidAmount: string) => {
    if (!wallet.provider || !wallet.connected) {
      alert('Please connect your wallet');
      return;
    }

    try {
      const contract = getContract(wallet.provider);
      const transaction = await contract.placeBid(tokenId, {
        value: ethers.utils.parseEther(bidAmount)
      });
      
      await transaction.wait();
      alert('Đấu giá thành công!');
      loadNFTs();
    } catch (error: any) {
      console.error('Error placing bid:', error);
      alert(error.message || 'Đấu giá thất bại');
    }
  };

  const filteredNFTs = nfts.filter(nft => {
    const metadata = nftMetadata[nft.tokenId];
    const matchesCategory = selectedCategory === 'Tất cả' || nft.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      (metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (metadata?.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const isAuctionEnded = (endTime: string) => {
    return parseInt(endTime) * 1000 < Date.now();
  };

  const formatTimeLeft = (endTime: string) => {
    const timeLeft = parseInt(endTime) * 1000 - Date.now();
    if (timeLeft <= 0) return 'Đã kết thúc';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} ngày ${hours} giờ`;
    if (hours > 0) return `${hours} giờ ${minutes} phút`;
    return `${minutes} phút`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải NFT...</p>
      </div>
    );
  }

  return (
    <div className="marketplace">
      <div className="container">
        <div className="marketplace-header">
          <h1>Chợ NFT</h1>
          <p>Khám phá, sưu tập và bán những NFT đặc biệt</p>
        </div>

        <div className="filters">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Tìm kiếm NFT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="category-filters">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {filteredNFTs.length === 0 ? (
          <div className="empty-state">
            <h3>Không tìm thấy NFT</h3>
            <p>Hãy là người đầu tiên tạo NFT!</p>
            <Link to="/create" className="create-btn">Tạo NFT</Link>
          </div>
        ) : (
          <div className="nft-grid">
            {filteredNFTs.map(nft => {
              const metadata = nftMetadata[nft.tokenId];
              return (
                <div key={nft.tokenId} className="nft-card">
                  <Link to={`/nft/${nft.tokenId}`} className="nft-link">
                    <div className="nft-image">
                      {metadata?.image ? (
                        <img src={metadata.image} alt={metadata.name} />
                      ) : (
                        <div className="image-placeholder">Loading...</div>
                      )}
                    </div>
                    
                    <div className="nft-info">
                      <h3 className="nft-name">{metadata?.name || `NFT #${nft.tokenId}`}</h3>
                      <p className="nft-category">{nft.category}</p>
                      
                      {nft.isAuction ? (
                        <div className="auction-info">
                          <div className="auction-status">
                            <span className="auction-label">Đấu giá</span>
                            <span className="time-left">{formatTimeLeft(nft.endTime)}</span>
                          </div>
                          <div className="bid-info">
                            <span className="current-bid">
                              Giá hiện tại: {formatPrice(nft.highestBid || nft.price)} TCRO
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="price-info">
                          <span className="price">{formatPrice(nft.price)} TCRO</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="nft-actions">
                    {nft.isAuction ? (
                      !isAuctionEnded(nft.endTime) && wallet.address !== nft.seller ? (
                        <button
                          onClick={() => {
                            const bidAmount = prompt('Nhập số tiền đấu giá (TCRO):');
                            if (bidAmount) placeBid(nft.tokenId, bidAmount);
                          }}
                          className="bid-btn"
                          disabled={!wallet.connected}
                        >
                          Đấu giá
                        </button>
                      ) : (
                        <span className="auction-ended">Đấu giá đã kết thúc</span>
                      )
                    ) : (
                      wallet.address !== nft.seller && (
                        <button
                          onClick={() => buyNFT(nft.tokenId, nft.price)}
                          className="buy-btn"
                          disabled={!wallet.connected}
                        >
                          Mua ngay
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
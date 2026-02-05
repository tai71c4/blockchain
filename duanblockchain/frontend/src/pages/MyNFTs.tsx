import React, { useState, useEffect } from 'react';
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

interface MyNFTsProps {
  wallet: WalletState;
}

const CATEGORIES = ['Nghệ thuật', 'Âm nhạc', 'Game', 'Thể thao', 'Chụp ảnh', 'Sưu tập'];

const MyNFTs: React.FC<MyNFTsProps> = ({ wallet }) => {
  const [ownedNFTs, setOwnedNFTs] = useState<MarketItem[]>([]);
  const [listedNFTs, setListedNFTs] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'owned' | 'listed'>('owned');
  const [nftMetadata, setNftMetadata] = useState<{[key: string]: any}>({});
  const [showListModal, setShowListModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<MarketItem | null>(null);
  const [listingPrice, setListingPrice] = useState('');
  const [listingCategory, setListingCategory] = useState('Nghệ thuật');
  const [auctionStartPrice, setAuctionStartPrice] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('24');

  useEffect(() => {
    if (wallet.connected && wallet.provider) {
      loadMyNFTs();
    }
  }, [wallet.connected, wallet.provider]);

  const loadMyNFTs = async () => {
    if (!wallet.provider) return;
    
    try {
      setLoading(true);
      const contract = getContract(wallet.provider);
      
      console.log('Contract address:', contract.address);
      console.log('Wallet address:', wallet.address);
      
      // Load owned NFTs
      const ownedData = await contract.fetchMyNFTs();
      console.log('Owned NFTs raw data:', ownedData);
      
      const listedData = await contract.fetchItemsListed();
      console.log('Listed NFTs raw data:', listedData);
      
      const loadNFTData = async (items: any[]) => {
        return Promise.all(items.map(async (item: any) => {
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
      };
      
      const owned = await loadNFTData(ownedData);
      const listed = await loadNFTData(listedData);
      
      setOwnedNFTs(owned.filter(item => item !== null) as MarketItem[]);
      setListedNFTs(listed.filter(item => item !== null) as MarketItem[]);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const listForSale = async () => {
    if (!wallet.provider || !selectedNFT || !listingPrice) return;
    
    try {
      const contract = getContract(wallet.provider);
      const listingFee = await contract.getListingPrice();
      
      const transaction = await contract.listForSale(
        selectedNFT.tokenId,
        ethers.utils.parseEther(listingPrice),
        listingCategory,
        { value: listingFee }
      );
      
      await transaction.wait();
      alert('NFT đã được đăng bán thành công!');
      
      setShowListModal(false);
      setSelectedNFT(null);
      setListingPrice('');
      loadMyNFTs();
    } catch (error: any) {
      console.error('Error listing NFT:', error);
      alert(error.message || 'Đăng bán NFT thất bại');
    }
  };

  const startAuction = async () => {
    if (!wallet.provider || !selectedNFT || !auctionStartPrice || !auctionDuration) return;
    
    try {
      const contract = getContract(wallet.provider);
      const listingFee = await contract.getListingPrice();
      const duration = parseInt(auctionDuration) * 60 * 60; // Convert hours to seconds
      
      const transaction = await contract.startAuction(
        selectedNFT.tokenId,
        ethers.utils.parseEther(auctionStartPrice),
        duration,
        listingCategory,
        { value: listingFee }
      );
      
      await transaction.wait();
      alert('Đấu giá bắt đầu thành công!');
      
      setShowAuctionModal(false);
      setSelectedNFT(null);
      setAuctionStartPrice('');
      loadMyNFTs();
    } catch (error: any) {
      console.error('Error starting auction:', error);
      alert(error.message || 'Khởi tạo đấu giá thất bại');
    }
  };

  const cancelListing = async (tokenId: string) => {
    if (!wallet.provider) return;
    
    try {
      const contract = getContract(wallet.provider);
      const transaction = await contract.cancelListing(tokenId);
      
      await transaction.wait();
      alert('Hủy đăng bán thành công!');
      loadMyNFTs();
    } catch (error: any) {
      console.error('Error cancelling listing:', error);
      alert(error.message || 'Hủy đăng bán thất bại');
    }
  };

  const endAuction = async (tokenId: string) => {
    if (!wallet.provider) return;
    
    try {
      const contract = getContract(wallet.provider);
      const transaction = await contract.endAuction(tokenId);
      
      await transaction.wait();
      alert('Đấu giá kết thúc thành công!');
      loadMyNFTs();
    } catch (error: any) {
      console.error('Error ending auction:', error);
      alert(error.message || 'Kết thúc đấu giá thất bại');
    }
  };

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

  if (!wallet.connected) {
    return (
      <div className="my-nfts">
        <div className="container">
          <div className="connect-prompt">
            <h2>Connect Your Wallet</h2>
            <p>Please connect your wallet to view your NFTs</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your NFTs...</p>
      </div>
    );
  }

  return (
    <div className="my-nfts">
      <div className="container">
        <div className="my-nfts-header">
          <h1>NFT của tôi</h1>
          <p>Quản lý bộ sưu tập NFT của bạn</p>
        </div>

        <div className="tabs">
          <button
            onClick={() => setActiveTab('owned')}
            className={`tab ${activeTab === 'owned' ? 'active' : ''}`}
          >
            Đang sở hữu ({ownedNFTs.length})
          </button>
          <button
            onClick={() => setActiveTab('listed')}
            className={`tab ${activeTab === 'listed' ? 'active' : ''}`}
          >
            Đã đăng bán ({listedNFTs.length})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'owned' ? (
            ownedNFTs.length === 0 ? (
              <div className="empty-state">
                <h3>Không có NFT nào</h3>
                <p>Bạn chưa sở hữu NFT nào. Tạo NFT đầu tiên của bạn!</p>
              </div>
            ) : (
              <div className="nft-grid">
                {ownedNFTs.map(nft => {
                  const metadata = nftMetadata[nft.tokenId];
                  return (
                    <div key={nft.tokenId} className="nft-card">
                      <div className="nft-image">
                        {metadata?.image ? (
                          <img src={metadata.image} alt={metadata.name} />
                        ) : (
                          <div className="image-placeholder">Loading...</div>
                        )}
                      </div>
                      
                      <div className="nft-info">
                        <h3 className="nft-name">{metadata?.name || `NFT #${nft.tokenId}`}</h3>
                        <p className="nft-description">{metadata?.description}</p>
                      </div>
                      
                      <div className="nft-actions">
                        <button
                          onClick={() => {
                            setSelectedNFT(nft);
                            setShowListModal(true);
                          }}
                          className="action-btn primary"
                        >
                          Đăng bán
                        </button>
                        <button
                          onClick={() => {
                            setSelectedNFT(nft);
                            setShowAuctionModal(true);
                          }}
                          className="action-btn secondary"
                        >
                          Bắt đầu đấu giá
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            listedNFTs.length === 0 ? (
              <div className="empty-state">
                <h3>Không có NFT nào đang bán</h3>
                <p>Bạn chưa đăng bán NFT nào.</p>
              </div>
            ) : (
              <div className="nft-grid">
                {listedNFTs.map(nft => {
                  const metadata = nftMetadata[nft.tokenId];
                  return (
                    <div key={nft.tokenId} className="nft-card">
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
                      
                      <div className="nft-actions">
                        {nft.isAuction ? (
                          isAuctionEnded(nft.endTime) ? (
                            <button
                              onClick={() => endAuction(nft.tokenId)}
                              className="action-btn primary"
                            >
                              Kết thúc đấu giá
                            </button>
                          ) : (
                            <button
                              onClick={() => cancelListing(nft.tokenId)}
                              className="action-btn danger"
                            >
                              Hủy đấu giá
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => cancelListing(nft.tokenId)}
                            className="action-btn danger"
                          >
                            Hủy đăng bán
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* List for Sale Modal */}
      {showListModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Đăng bán NFT</h3>
              <button onClick={() => setShowListModal(false)} className="close-btn">✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Giá (TCRO)</label>
                <input
                  type="number"
                  step="0.001"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                  placeholder="Nhập giá bằng TCRO"
                />
              </div>
              <div className="form-group">
                <label>Danh mục</label>
                <select
                  value={listingCategory}
                  onChange={(e) => setListingCategory(e.target.value)}
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowListModal(false)} className="cancel-btn">
                Hủy
              </button>
              <button onClick={listForSale} className="confirm-btn">
                Đăng bán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Auction Modal */}
      {showAuctionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Bắt đầu đấu giá</h3>
              <button onClick={() => setShowAuctionModal(false)} className="close-btn">✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Giá khởi điểm (TCRO)</label>
                <input
                  type="number"
                  step="0.001"
                  value={auctionStartPrice}
                  onChange={(e) => setAuctionStartPrice(e.target.value)}
                  placeholder="Nhập giá khởi điểm bằng TCRO"
                />
              </div>
              <div className="form-group">
                <label>Thời gian (Giờ)</label>
                <select
                  value={auctionDuration}
                  onChange={(e) => setAuctionDuration(e.target.value)}
                >
                  <option value="1">1 Giờ</option>
                  <option value="6">6 Giờ</option>
                  <option value="12">12 Giờ</option>
                  <option value="24">24 Giờ</option>
                  <option value="48">48 Giờ</option>
                  <option value="72">72 Giờ</option>
                  <option value="168">1 Tuần</option>
                </select>
              </div>
              <div className="form-group">
                <label>Danh mục</label>
                <select
                  value={listingCategory}
                  onChange={(e) => setListingCategory(e.target.value)}
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAuctionModal(false)} className="cancel-btn">
                Hủy
              </button>
              <button onClick={startAuction} className="confirm-btn">
                Bắt đầu đấu giá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyNFTs;
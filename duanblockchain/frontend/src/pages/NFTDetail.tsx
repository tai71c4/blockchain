import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { getContract, formatPrice, formatAddress } from '../utils/web3';

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

interface NFTDetailProps {
  wallet: WalletState;
}

const NFTDetail: React.FC<NFTDetailProps> = ({ wallet }) => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const [nft, setNft] = useState<MarketItem | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');

  useEffect(() => {
    if (tokenId && wallet.provider) {
      loadNFTDetail();
    }
  }, [tokenId, wallet.provider]);

  const loadNFTDetail = async () => {
    if (!tokenId || !wallet.provider) return;
    
    try {
      setLoading(true);
      const contract = getContract(wallet.provider);
      
      // Try to get from market items first
      const marketItems = await contract.fetchMarketItems();
      let nftData = marketItems.find((item: any) => item.tokenId.toString() === tokenId);
      
      // If not in market, try owned NFTs
      if (!nftData) {
        const ownedItems = await contract.fetchMyNFTs();
        nftData = ownedItems.find((item: any) => item.tokenId.toString() === tokenId);
      }
      
      // If still not found, try listed items
      if (!nftData) {
        const listedItems = await contract.fetchItemsListed();
        nftData = listedItems.find((item: any) => item.tokenId.toString() === tokenId);
      }
      
      if (nftData) {
        const nftItem: MarketItem = {
          tokenId: nftData.tokenId.toString(),
          seller: nftData.seller,
          owner: nftData.owner,
          price: nftData.price.toString(),
          sold: nftData.sold,
          category: nftData.category,
          createdAt: nftData.createdAt.toString(),
          isAuction: nftData.isAuction,
          endTime: nftData.endTime.toString(),
          highestBid: nftData.highestBid.toString(),
          highestBidder: nftData.highestBidder,
          creator: nftData.creator,
        };
        
        setNft(nftItem);
        
        // Load metadata
        const tokenUri = await contract.tokenURI(tokenId);
        const meta = await fetch(tokenUri).then(res => res.json());
        setMetadata(meta);
      }
    } catch (error) {
      console.error('Error loading NFT detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const buyNFT = async () => {
    if (!wallet.provider || !nft || !wallet.connected) {
      alert('Please connect your wallet');
      return;
    }

    try {
      const contract = getContract(wallet.provider);
      const transaction = await contract.createMarketSale(nft.tokenId, {
        value: nft.price
      });
      
      await transaction.wait();
      alert('Mua NFT thành công!');
      loadNFTDetail();
    } catch (error: any) {
      console.error('Error buying NFT:', error);
      alert(error.message || 'Mua NFT thất bại');
    }
  };

  const placeBid = async () => {
    if (!wallet.provider || !nft || !bidAmount || !wallet.connected) {
      alert('Vui lòng nhập số tiền đấu giá hợp lệ');
      return;
    }

    try {
      const contract = getContract(wallet.provider);
      const transaction = await contract.placeBid(nft.tokenId, {
        value: ethers.utils.parseEther(bidAmount)
      });
      
      await transaction.wait();
      alert('Đấu giá thành công!');
      setBidAmount('');
      loadNFTDetail();
    } catch (error: any) {
      console.error('Error placing bid:', error);
      alert(error.message || 'Đấu giá thất bại');
    }
  };

  const isAuctionEnded = () => {
    if (!nft) return false;
    return parseInt(nft.endTime) * 1000 < Date.now();
  };

  const formatTimeLeft = () => {
    if (!nft) return '';
    const timeLeft = parseInt(nft.endTime) * 1000 - Date.now();
    if (timeLeft <= 0) return 'Đã kết thúc';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} ngày ${hours} giờ ${minutes} phút`;
    if (hours > 0) return `${hours} giờ ${minutes} phút`;
    return `${minutes} phút`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin NFT...</p>
      </div>
    );
  }

  if (!nft || !metadata) {
    return (
      <div className="nft-detail">
        <div className="container">
          <div className="error-state">
            <h2>Không tìm thấy NFT</h2>
            <p>NFT yêu cầu không tồn tại.</p>
            <Link to="/" className="back-btn">Trở về Chợ NFT</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nft-detail">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">Chợ NFT</Link>
          <span> / </span>
          <span>NFT #{nft.tokenId}</span>
        </div>

        <div className="nft-detail-content">
          <div className="nft-media">
            {metadata.image ? (
              metadata.image.includes('.mp4') || metadata.image.includes('.mov') ? (
                <video src={metadata.image} controls className="nft-video" />
              ) : (
                <img src={metadata.image} alt={metadata.name} className="nft-image" />
              )
            ) : (
              <div className="image-placeholder">No Image</div>
            )}
          </div>

          <div className="nft-info">
            <div className="nft-header">
              <h1 className="nft-title">{metadata.name}</h1>
              <span className="nft-category">{nft.category}</span>
            </div>

            <div className="nft-description">
              <p>{metadata.description}</p>
            </div>

            {metadata.attributes && metadata.attributes.length > 0 && (
              <div className="nft-attributes">
                <h3>Thuộc tính</h3>
                <div className="attributes-grid">
                  {metadata.attributes.map((attr: any, index: number) => (
                    <div key={index} className="attribute">
                      <span className="trait-type">{attr.trait_type}</span>
                      <span className="trait-value">{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="nft-details">
              <div className="detail-item">
                <span className="label">Token ID:</span>
                <span className="value">#{nft.tokenId}</span>
              </div>
              <div className="detail-item">
                <span className="label">Người tạo:</span>
                <span className="value">{formatAddress(nft.creator)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Chủ sở hữu:</span>
                <span className="value">{formatAddress(nft.owner)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Ngày tạo:</span>
                <span className="value">{formatDate(nft.createdAt)}</span>
              </div>
            </div>

            <div className="nft-pricing">
              {nft.isAuction ? (
                <div className="auction-section">
                  <div className="auction-header">
                    <h3>Đấu giá</h3>
                    <span className={`auction-status ${isAuctionEnded() ? 'ended' : 'active'}`}>
                      {isAuctionEnded() ? 'Đã kết thúc' : 'Đang diễn ra'}
                    </span>
                  </div>
                  
                  <div className="auction-info">
                    <div className="current-bid">
                      <span className="label">Giá hiện tại:</span>
                      <span className="price">
                        {formatPrice(nft.highestBid || nft.price)} TCRO
                      </span>
                    </div>
                    
                    {nft.highestBidder !== '0x0000000000000000000000000000000000000000' && (
                      <div className="highest-bidder">
                        <span className="label">Người đấu giá cao nhất:</span>
                        <span className="address">{formatAddress(nft.highestBidder)}</span>
                      </div>
                    )}
                    
                    <div className="time-left">
                      <span className="label">Thời gian còn lại:</span>
                      <span className="time">{formatTimeLeft()}</span>
                    </div>
                  </div>

                  {!isAuctionEnded() && wallet.address !== nft.seller && wallet.connected && (
                    <div className="bid-section">
                      <div className="bid-input">
                        <input
                          type="number"
                          step="0.001"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder="Nhập số tiền đấu giá (TCRO)"
                        />
                        <button onClick={placeBid} className="bid-btn">
                          Đấu giá
                        </button>
                      </div>
                      <p className="bid-hint">
                        Giá đấu tối thiểu: {formatPrice((parseInt(nft.highestBid || nft.price) + 1000000000000000).toString())} TCRO
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="fixed-price-section">
                  <div className="price-info">
                    <span className="label">Giá:</span>
                    <span className="price">{formatPrice(nft.price)} TCRO</span>
                  </div>
                  
                  {wallet.address !== nft.seller && wallet.connected && (
                    <button onClick={buyNFT} className="buy-btn">
                      Mua ngay
                    </button>
                  )}
                </div>
              )}
            </div>

            {!wallet.connected && (
              <div className="connect-prompt">
                <p>Kết nối ví của bạn để tương tác với NFT này</p>
              </div>
            )}
          </div>
        </div>

        <div className="transaction-info">
          <h3>Thông tin giao dịch</h3>
          <div className="transaction-links">
            <a
              href={`https://testnet.cronoscan.com/token/${nft.tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="explorer-link"
            >
              Xem trên Cronos Explorer
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTDetail;
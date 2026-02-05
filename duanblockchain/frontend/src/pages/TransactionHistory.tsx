import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract, formatPrice, formatAddress } from '../utils/web3';

interface Transaction {
  hash: string;
  type: string;
  tokenId: string;
  from: string;
  to: string;
  price: string;
  timestamp: number;
  blockNumber: number;
}

interface WalletState {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  address: string;
  balance: string;
  connected: boolean;
}

interface TransactionHistoryProps {
  wallet: WalletState;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ wallet }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mint' | 'sale' | 'auction'>('all');

  useEffect(() => {
    if (wallet.connected && wallet.provider) {
      loadTransactions();
    }
  }, [wallet.connected, wallet.provider]);

  const loadTransactions = async () => {
    if (!wallet.provider) return;
    
    try {
      setLoading(true);
      const contract = getContract(wallet.provider);
      
      const allTransactions: Transaction[] = [];
      
      // Get Transfer events (mint and transfers)
      const transferFilter = contract.filters.Transfer();
      const transferEvents = await contract.queryFilter(transferFilter, -5000);
      
      for (const event of transferEvents) {
        if (event.args) {
          const block = await event.getBlock();
          const isMint = event.args.from === '0x0000000000000000000000000000000000000000';
          
          if (event.args.to === wallet.address || event.args.from === wallet.address) {
            allTransactions.push({
              hash: event.transactionHash,
              type: isMint ? 'Mint' : 'Transfer',
              tokenId: event.args.tokenId.toString(),
              from: event.args.from,
              to: event.args.to,
              price: '0',
              timestamp: block.timestamp,
              blockNumber: event.blockNumber
            });
          }
        }
      }
      
      // Get MarketItemCreated events (listings)
      try {
        const listingFilter = contract.filters.MarketItemCreated();
        const listingEvents = await contract.queryFilter(listingFilter, -5000);
        
        for (const event of listingEvents) {
          if (event.args && event.args.seller === wallet.address) {
            const block = await event.getBlock();
            allTransactions.push({
              hash: event.transactionHash,
              type: event.args.isAuction ? 'Auction Started' : 'Listed for Sale',
              tokenId: event.args.tokenId.toString(),
              from: event.args.seller,
              to: 'Marketplace',
              price: event.args.price.toString(),
              timestamp: block.timestamp,
              blockNumber: event.blockNumber
            });
          }
        }
      } catch (e) {
        console.log('No MarketItemCreated events found');
      }
      
      // Sort by timestamp desc
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(allTransactions);
      
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    // Only show transactions with money involved
    const hasValue = tx.price !== '0' && tx.type !== 'Mint' && tx.type !== 'Transfer';
    
    if (filter === 'all') return hasValue;
    if (filter === 'sale') return tx.type === 'Sale';
    if (filter === 'auction') return tx.type === 'Auction Won';
    return hasValue;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('vi-VN');
  };

  const getTransactionUrl = (hash: string) => {
    return `https://testnet.cronoscan.com/tx/${hash}`;
  };

  if (!wallet.connected) {
    return (
      <div className="transaction-history">
        <div className="container">
          <div className="connect-prompt">
            <h2>Kết nối ví của bạn</h2>
            <p>Vui lòng kết nối ví để xem lịch sử giao dịch</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải lịch sử giao dịch...</p>
      </div>
    );
  }

  return (
    <div className="transaction-history">
      <div className="container">
        <div className="history-header">
          <h1>Lịch sử giao dịch</h1>
          <p>Theo dõi tất cả giao dịch NFT của bạn</p>
        </div>

        <div className="filters">
          <button
            onClick={() => setFilter('all')}
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          >
            Tất cả ({transactions.filter(tx => tx.price !== '0' && tx.type !== 'Mint' && tx.type !== 'Transfer').length})
          </button>
          <button
            onClick={() => setFilter('sale')}
            className={`filter-btn ${filter === 'sale' ? 'active' : ''}`}
          >
            Bán ({transactions.filter(tx => tx.type === 'Sale').length})
          </button>
          <button
            onClick={() => setFilter('auction')}
            className={`filter-btn ${filter === 'auction' ? 'active' : ''}`}
          >
            Đấu giá ({transactions.filter(tx => tx.type === 'Auction Won').length})
          </button>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <h3>Không có giao dịch nào</h3>
            <p>Bạn chưa có giao dịch NFT nào.</p>
          </div>
        ) : (
          <div className="transaction-list">
            {filteredTransactions.map((tx, index) => (
              <div key={index} className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-type">
                    <span className={`type-badge ${tx.type.toLowerCase().replace(' ', '-')}`}>
                      {tx.type}
                    </span>
                    <span className="token-id">NFT #{tx.tokenId}</span>
                  </div>
                  
                  <div className="transaction-details">
                    <div className="addresses">
                      <span>Từ: {formatAddress(tx.from)}</span>
                      <span>→</span>
                      <span>Đến: {formatAddress(tx.to)}</span>
                    </div>
                    
                    {tx.price !== '0' && (
                      <div className="price">
                        <span>Giá: {formatPrice(tx.price)} TCRO</span>
                      </div>
                    )}
                    
                    <div className="timestamp">
                      <span>{formatDate(tx.timestamp)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="transaction-actions">
                  <a
                    href={getTransactionUrl(tx.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-tx-btn"
                  >
                    Xem trên Explorer
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
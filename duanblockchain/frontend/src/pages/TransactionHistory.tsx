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
  const [filter, setFilter] = useState<'all' | 'mint' | 'buy' | 'sell' | 'auction'>('all');

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
      
      // Get recent transactions with smaller block range to avoid RPC limit
      const currentBlock = await wallet.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 500); // Only last 500 blocks
      
      console.log(`Scanning blocks ${fromBlock} to ${currentBlock}`);
      
      // Get Transfer events (mint and transfers)
      const transferFilter = contract.filters.Transfer();
      const transferEvents = await contract.queryFilter(transferFilter, fromBlock);
      
      for (const event of transferEvents) {
        if (event.args) {
          const block = await event.getBlock();
          const transaction = await event.getTransaction();
          const isMint = event.args.from === '0x0000000000000000000000000000000000000000';
          
          // Check if user is involved in this transaction
          const isUserInvolved = event.args.to === wallet.address || 
                               event.args.from === wallet.address ||
                               transaction.from === wallet.address;
          
          if (isUserInvolved) {
            // Determine transaction type based on transaction data
            let txType = 'Transfer';
            let price = '0';
            
            if (isMint) {
              txType = 'Mint';
            } else if (transaction.value && transaction.value.gt(0)) {
              // Determine if user is buyer or seller
              if (transaction.from === wallet.address) {
                txType = 'Buy'; // User sent money = buying
              } else if (event.args.from === wallet.address) {
                txType = 'Sell'; // User sent NFT = selling
              } else {
                txType = 'Transfer';
              }
              price = transaction.value.toString();
            }
            
            allTransactions.push({
              hash: event.transactionHash,
              type: txType,
              tokenId: event.args.tokenId.toString(),
              from: event.args.from,
              to: event.args.to,
              price: price,
              timestamp: block.timestamp,
              blockNumber: event.blockNumber
            });
          }
        }
      }
      
      // Get MarketItemCreated events (listings) with same block range
      try {
        const listingFilter = contract.filters.MarketItemCreated();
        const listingEvents = await contract.queryFilter(listingFilter, fromBlock);
        
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
        console.log('No MarketItemCreated events found:', e);
      }
      
      // Remove duplicates based on hash + tokenId
      const uniqueTransactions = allTransactions.filter((tx, index, self) => 
        index === self.findIndex(t => t.hash === tx.hash && t.tokenId === tx.tokenId)
      );
      
      // Sort by timestamp desc
      uniqueTransactions.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(uniqueTransactions);
      
      console.log('Loaded transactions:', uniqueTransactions);
      
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'buy') return tx.type === 'Buy';
    if (filter === 'sell') return tx.type === 'Sell' || tx.type === 'Listed for Sale';
    if (filter === 'auction') return tx.type.includes('Auction');
    if (filter === 'mint') return tx.type === 'Mint';
    return true;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('vi-VN');
  };

  const getTransactionUrl = (hash: string) => {
    return `https://testnet.cronoscan.com/tx/${hash}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Mint': return '🎨';
      case 'Buy': return '🛒';
      case 'Sell': return '💰';
      case 'Listed for Sale': return '🏷️';
      case 'Auction Started': return '⚡';
      case 'Transfer': return '📤';
      default: return '📋';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Mint': return '#10b981';
      case 'Buy': return '#3b82f6';
      case 'Sell': return '#f59e0b';
      case 'Listed for Sale': return '#6366f1';
      case 'Auction Started': return '#8b5cf6';
      case 'Transfer': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (!wallet.connected) {
    return (
      <div className="transaction-history">
        <div className="container">
          <div className="empty-state">
            <h2>🔗 Kết nối ví của bạn</h2>
            <p>Vui lòng kết nối ví để xem lịch sử giao dịch</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-history">
      <div className="container">
        {/* Header */}
        <div className="history-header">
          <h1>📊 Lịch sử giao dịch</h1>
          <p>Theo dõi tất cả hoạt động NFT của bạn</p>
        </div>

        {/* Controls */}
        <div className="history-controls">
          <div className="filter-tabs">
            <button
              onClick={() => setFilter('all')}
              className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
            >
              Tất cả <span className="count">({transactions.length})</span>
            </button>
            <button
              onClick={() => setFilter('mint')}
              className={`tab-btn ${filter === 'mint' ? 'active' : ''}`}
            >
              Mint <span className="count">({transactions.filter(tx => tx.type === 'Mint').length})</span>
            </button>
            <button
              onClick={() => setFilter('buy')}
              className={`tab-btn ${filter === 'buy' ? 'active' : ''}`}
            >
              Mua <span className="count">({transactions.filter(tx => tx.type === 'Buy').length})</span>
            </button>
            <button
              onClick={() => setFilter('sell')}
              className={`tab-btn ${filter === 'sell' ? 'active' : ''}`}
            >
              Bán <span className="count">({transactions.filter(tx => tx.type === 'Sell' || tx.type === 'Listed for Sale').length})</span>
            </button>
            <button
              onClick={() => setFilter('auction')}
              className={`tab-btn ${filter === 'auction' ? 'active' : ''}`}
            >
              Đấu giá <span className="count">({transactions.filter(tx => tx.type.includes('Auction')).length})</span>
            </button>
          </div>
          
          <button
            onClick={loadTransactions}
            className={`refresh-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? '⏳' : '🔄'} {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Đang tải lịch sử giao dịch...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <h3>📭 Không có giao dịch nào</h3>
            <p>Bạn chưa có giao dịch NFT nào trong khoảng thời gian gần đây.</p>
          </div>
        ) : (
          <div className="transaction-list">
            {filteredTransactions.map((tx, index) => (
              <div key={`${tx.hash}-${tx.tokenId}`} className="transaction-card">
                <div className="tx-icon">
                  <span style={{ color: getTypeColor(tx.type) }}>
                    {getTypeIcon(tx.type)}
                  </span>
                </div>
                
                <div className="tx-content">
                  <div className="tx-header">
                    <div className="tx-type">
                      <span className="type-label" style={{ color: getTypeColor(tx.type) }}>
                        {tx.type}
                      </span>
                      <span className="token-id">NFT #{tx.tokenId}</span>
                    </div>
                    <div className="tx-time">
                      {formatDate(tx.timestamp)}
                    </div>
                  </div>
                  
                  <div className="tx-details">
                    <div className="tx-addresses">
                      <span className="from">Từ: {formatAddress(tx.from)}</span>
                      <span className="arrow">→</span>
                      <span className="to">Đến: {formatAddress(tx.to)}</span>
                    </div>
                    
                    {tx.price !== '0' && (
                      <div className="tx-price">
                        💎 {formatPrice(tx.price)} TCRO
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="tx-actions">
                  <a
                    href={getTransactionUrl(tx.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="explorer-btn"
                  >
                    🔍 Explorer
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
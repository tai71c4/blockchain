import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { connectWallet, formatAddress, CRONOS_TESTNET_CONFIG } from './utils/web3';
import Marketplace from './pages/Marketplace';
import CreateNFT from './pages/CreateNFT';
import MyNFTs from './pages/MyNFTs';
import NFTDetail from './pages/NFTDetail';
import TransactionHistory from './pages/TransactionHistory';
import './styles/App.css';

interface WalletState {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  address: string;
  balance: string;
  connected: boolean;
}

function App() {
  const [wallet, setWallet] = useState<WalletState>({
    provider: null,
    signer: null,
    address: '',
    balance: '0',
    connected: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkWalletConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await handleConnect();
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    console.log('Account changed:', accounts);
    if (accounts.length === 0) {
      // User disconnected
      setWallet({
        provider: null,
        signer: null,
        address: '',
        balance: '0',
        connected: false,
      });
    } else {
      // User switched accounts - force reconnect
      try {
        const walletData = await connectWallet();
        setWallet({
          provider: walletData.provider,
          signer: walletData.signer,
          address: walletData.address,
          balance: walletData.balance,
          connected: true,
        });
        console.log('Switched to account:', walletData.address);
      } catch (error) {
        console.error('Error switching account:', error);
      }
    }
  };

  const handleChainChanged = () => {
    console.log('Chain changed, reloading...');
    // Force page reload to ensure clean state
    window.location.reload();
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const walletData = await connectWallet();
      setWallet({
        provider: walletData.provider,
        signer: walletData.signer,
        address: walletData.address,
        balance: walletData.balance,
        connected: true,
      });
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      alert(error.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setWallet({
      provider: null,
      signer: null,
      address: '',
      balance: '0',
      connected: false,
    });
  };

  return (
    <Router>
      <div className="App">
        <header className="header">
          <div className="container">
            <Link to="/" className="logo">
              <h1>CronosNFT</h1>
            </Link>
            
            <nav className="nav">
              <Link to="/" className="nav-link">Chợ NFT</Link>
              <Link to="/create" className="nav-link">Tạo NFT</Link>
              <Link to="/my-nfts" className="nav-link">NFT của tôi</Link>
              <Link to="/history" className="nav-link">Lịch sử</Link>
            </nav>

            <div className="wallet-section">
              {wallet.connected ? (
                <div className="wallet-info">
                  <div className="wallet-details">
                    <span className="address">{formatAddress(wallet.address)}</span>
                    <span className="balance">{parseFloat(wallet.balance).toFixed(4)} TCRO</span>
                  </div>
                  <div className="wallet-actions">
                    <button onClick={handleConnect} className="refresh-btn" title="Refresh account">
                      🔄
                    </button>
                    <button onClick={handleDisconnect} className="disconnect-btn">
                      Ngắt kết nối
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleConnect} 
                  disabled={loading}
                  className="connect-btn"
                >
                  {loading ? 'Đang kết nối...' : 'Kết nối ví'}
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<Marketplace wallet={wallet} />} />
            <Route path="/create" element={<CreateNFT wallet={wallet} />} />
            <Route path="/my-nfts" element={<MyNFTs wallet={wallet} />} />
            <Route path="/history" element={<TransactionHistory wallet={wallet} />} />
            <Route path="/nft/:tokenId" element={<NFTDetail wallet={wallet} />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="container">
            <p>&copy; 2024 CronosNFT Marketplace - Đồ án sinh viên</p>
            <div className="network-info">
              <span>Mạng thử nghiệm Cronos</span>
              <a 
                href="https://testnet.cronoscan.com/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Explorer
              </a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
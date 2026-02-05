# NFT Marketplace Project

## 🚀 Quick Setup

### Prerequisites
- Node.js (v16 or higher)
- Git
- MetaMask wallet

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd duanblockchain
```

2. **Run setup script**
```bash
# Windows
setup.bat

# Or manual setup:
npm install
cd frontend && npm install && cd ..
```

3. **Configure environment**
- Copy `.env.example` to `.env`
- Fill in your credentials:
  - `PRIVATE_KEY`: Your wallet private key
  - `CRONOS_API_KEY`: Get from Cronos
  - `PINATA_API_KEY`: Get from Pinata.cloud
  - `PINATA_SECRET_API_KEY`: From Pinata
  - `PINATA_JWT`: From Pinata

### Development

1. **Compile contracts**
```bash
npx hardhat compile
```

2. **Deploy to testnet**
```bash
npx hardhat run scripts/deploy.js --network cronos_testnet
```

3. **Start frontend**
```bash
cd frontend
npm start
```

## 🔒 Security Notes

- **NEVER** commit `.env` file
- Keep your private keys secure
- Use testnet for development

## 📁 Project Structure

```
duanblockchain/
├── contracts/          # Smart contracts
├── frontend/           # React frontend
├── scripts/            # Deployment scripts
├── .env.example        # Environment template
└── setup.bat          # Setup script
```

## 🛠 Available Scripts

- `npm run compile` - Compile contracts
- `npm run deploy` - Deploy to testnet
- `npm run test` - Run tests
- `cd frontend && npm start` - Start frontend

## 🤝 Team Collaboration

1. Each member creates their own `.env` from `.env.example`
2. Use separate wallets for testing
3. Share contract addresses after deployment
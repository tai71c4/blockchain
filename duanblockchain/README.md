# CronosNFT Marketplace

Một marketplace NFT phi tập trung được xây dựng trên Cronos Testnet, cho phép người dùng tạo, mua bán và đấu giá NFT một cách an toàn và minh bạch.

## 🌟 Tính năng chính

### 🔗 Quản lý Ví & Kết nối
- Kết nối tự động với MetaMask
- Tự động chuyển sang mạng Cronos Testnet
- Hiển thị thông tin ví và số dư TCRO
- Kiểm tra network đúng (Chain ID: 338)

### 🎨 Tạo NFT (Minting)
- Upload file ảnh/video lên IPFS thông qua Pinata
- Tạo metadata cho NFT với attributes tùy chỉnh
- Mint NFT trên blockchain và lưu trực tiếp vào ví
- Hỗ trợ các định dạng: PNG, JPG, GIF, MP4

### 🏪 Marketplace
- Xem danh sách NFT đang bán (fixed price) hoặc đấu giá
- Lọc theo danh mục (Art, Music, Gaming, Sports, v.v.)
- Tìm kiếm NFT theo tên
- Mua NFT fixed price bằng TCRO
- Đặt bid cho auction với countdown timer

### 👤 Quản lý NFT Cá nhân
- Xem NFT đang sở hữu
- List bán fixed price hoặc khởi tạo đấu giá
- Hủy bán (cancel listing)
- Theo dõi trạng thái bán/đấu giá

### 📊 Chi tiết NFT
- Xem thông tin đầy đủ của NFT
- Hiển thị ảnh/video chất lượng cao
- Thông tin metadata và attributes
- Lịch sử sở hữu và giao dịch

## 🛠 Công nghệ sử dụng

### Smart Contract
- **Solidity**: 0.8.19 với optimizer
- **OpenZeppelin**: ERC721, Ownable, ReentrancyGuard, ERC721Enumerable
- **Hardhat**: Framework phát triển và deploy
- **Cronos Testnet**: Chain ID 338

### Frontend
- **React**: 19.2.4 với TypeScript
- **Ethers.js**: 5.7.2 cho tích hợp Web3
- **React Router**: Navigation
- **Responsive Design**: Mobile-first approach

### Storage & IPFS
- **Pinata**: Upload và lưu trữ file NFT trên IPFS
- **IPFS**: Lưu trữ phi tập trung cho metadata và media

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js >= 16.0.0
- npm hoặc yarn
- MetaMask extension
- Git

### 1. Clone repository
```bash
git clone <repository-url>
cd duanblockchain
```

### 2. Cài đặt dependencies cho smart contract
```bash
npm install
```

### 3. Cài đặt dependencies cho frontend
```bash
cd frontend
npm install
cd ..
```

### 4. Cấu hình environment variables
Tạo file `.env` trong thư mục root:
```env
PRIVATE_KEY=your_private_key_here
CRONOS_API_KEY=your_cronos_api_key_here
CONTRACT_ADDRESS=0x6Db42923d22dC0c8ECC800e388DcD299551eadC3
```

### 5. Compile smart contract
```bash
npx hardhat compile
```

### 6. Deploy smart contract (nếu cần)
```bash
npx hardhat run scripts/deploy.js --network cronosTestnet
```

### 7. Chạy frontend
```bash
cd frontend
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## 📋 Hướng dẫn sử dụng

### 1. Kết nối ví
- Cài đặt MetaMask extension
- Kết nối ví với ứng dụng
- Ứng dụng sẽ tự động chuyển sang Cronos Testnet

### 2. Lấy TCRO test
- Truy cập [Cronos Faucet](https://cronos.org/faucet)
- Nhập địa chỉ ví để nhận TCRO test

### 3. Tạo NFT
- Vào trang "Create NFT"
- Upload file ảnh/video
- Điền thông tin NFT (tên, mô tả, category)
- Thêm attributes (tùy chọn)
- Click "Create NFT" và confirm transaction

### 4. Bán NFT
- Vào trang "My NFTs"
- Chọn NFT muốn bán
- Chọn "List for Sale" (fixed price) hoặc "Start Auction"
- Đặt giá và confirm transaction

### 5. Mua NFT
- Browse marketplace
- Chọn NFT muốn mua
- Click "Buy Now" hoặc "Place Bid"
- Confirm transaction

## 🔧 Cấu trúc dự án

```
duanblockchain/
├── contracts/
│   └── NFTMarketplace.sol      # Smart contract chính
├── scripts/
│   └── deploy.js               # Script deploy contract
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/             # Các trang chính
│   │   ├── utils/             # Utility functions
│   │   ├── styles/            # CSS styles
│   │   └── contracts/         # Contract ABI và address
│   └── public/                # Static files
├── hardhat.config.js          # Cấu hình Hardhat
├── package.json               # Dependencies backend
└── .env                       # Environment variables
```

## 💰 Tokenomics

### Phí giao dịch
- **Mint Fee**: 0 TCRO (chỉ gas fee)
- **Listing/Auction Fee**: 0.025 TCRO
- **Platform Fee**: 0%
- **Royalty**: 2.5% cho creator khi bán lại

### Luồng tiền
- Buyer → Seller (trừ royalty)
- Listing fee → Contract Owner
- Gas fee → Cronos Network

## 🔒 Bảo mật

### Smart Contract Security
- **ReentrancyGuard**: Chống tấn công reentrancy
- **Ownable**: Quản lý quyền admin
- **Input validation**: Kiểm tra dữ liệu đầu vào
- **Safe transfers**: Chuyển ETH/NFT an toàn

### Frontend Security
- Kiểm tra kết nối MetaMask
- Validation network đúng
- Xử lý lỗi transaction
- Sanitize user input

## 🌐 Network Information

- **Network**: Cronos Testnet
- **Chain ID**: 338
- **RPC URL**: https://evm-t3.cronos.org
- **Explorer**: https://testnet.cronoscan.com
- **Contract Address**: 0x6Db42923d22dC0c8ECC800e388DcD299551eadC3

## 📝 Smart Contract Functions

### Core Functions
- `mint(tokenURI)`: Tạo NFT mới
- `listForSale(tokenId, price, category)`: List NFT bán
- `startAuction(tokenId, startPrice, duration, category)`: Khởi tạo đấu giá
- `placeBid(tokenId)`: Đặt bid
- `endAuction(tokenId)`: Kết thúc đấu giá
- `createMarketSale(tokenId)`: Mua NFT
- `cancelListing(tokenId)`: Hủy listing

### View Functions
- `fetchMarketItems()`: Lấy NFT đang bán
- `fetchMyNFTs()`: Lấy NFT sở hữu
- `fetchItemsListed()`: Lấy NFT đã list
- `tokenURI(tokenId)`: Lấy metadata URI

## 🐛 Troubleshooting

### Lỗi thường gặp

1. **MetaMask không kết nối được**
   - Kiểm tra MetaMask đã cài đặt
   - Refresh trang và thử lại
   - Kiểm tra network đã đúng Cronos Testnet

2. **Transaction failed**
   - Kiểm tra số dư TCRO đủ cho gas fee
   - Tăng gas limit nếu cần
   - Kiểm tra contract address đúng

3. **NFT không hiển thị**
   - Đợi vài phút để IPFS sync
   - Kiểm tra metadata URL
   - Refresh trang

4. **Upload file lỗi**
   - Kiểm tra kích thước file < 100MB
   - Kiểm tra định dạng file được hỗ trợ
   - Kiểm tra kết nối internet

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console browser để xem lỗi chi tiết
2. Kiểm tra transaction trên Cronos Explorer
3. Đảm bảo đã follow đúng hướng dẫn setup

## 📄 License

Dự án này được phát triển cho mục đích học tập và nghiên cứu.

---

**Lưu ý**: Đây là testnet, không sử dụng tiền thật. Chỉ dùng cho mục đích học tập và demo.
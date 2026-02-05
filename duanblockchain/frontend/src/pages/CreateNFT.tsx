import React, { useState } from 'react';
import { ethers } from 'ethers';
import { getContract } from '../utils/web3';
import { uploadFileToIPFS, uploadMetadataToIPFS, createNFTMetadata } from '../utils/pinata';

interface WalletState {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  address: string;
  balance: string;
  connected: boolean;
}

interface CreateNFTProps {
  wallet: WalletState;
}

const CATEGORIES = ['Nghệ thuật', 'Âm nhạc', 'Game', 'Thể thao', 'Chụp ảnh', 'Sưu tập'];

const CreateNFT: React.FC<CreateNFTProps> = ({ wallet }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Nghệ thuật',
  });
  const [file, setFile] = useState<File | null>(null);
  const [attributes, setAttributes] = useState<Array<{trait_type: string, value: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }]);
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    setAttributes(newAttributes);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const createNFT = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet.connected || !wallet.provider) {
      alert('Vui lòng kết nối ví của bạn');
      return;
    }

    if (!file) {
      alert('Vui lòng chọn file');
      return;
    }

    if (!formData.name || !formData.description) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);

    try {
      // Upload file to IPFS
      console.log('Uploading file to IPFS...');
      const imageUrl = await uploadFileToIPFS(file);
      
      // Create metadata
      const metadata = createNFTMetadata(
        formData.name,
        formData.description,
        imageUrl,
        attributes.filter(attr => attr.trait_type && attr.value)
      );
      
      // Upload metadata to IPFS
      console.log('Uploading metadata to IPFS...');
      const metadataUrl = await uploadMetadataToIPFS(metadata);
      console.log('Metadata URL:', metadataUrl);
      
      // Validate metadata URL
      if (!metadataUrl || metadataUrl.length > 500) {
        throw new Error('Invalid metadata URL');
      }
      
      // Mint NFT
      console.log('Minting NFT...');
      console.log('Metadata URL:', metadataUrl);
      console.log('Wallet address:', wallet.address);
      
      const contract = getContract(wallet.provider);
      console.log('Contract address:', contract.address);
      
      // Try to mint
      try {
        const transaction = await contract.mint(metadataUrl, {
          gasLimit: 500000
        });
        console.log('Transaction sent:', transaction.hash);
        
        const receipt = await transaction.wait();
        console.log('Transaction confirmed:', receipt);
        
        // Get token ID from events
        const transferEvent = receipt.events?.find((e: any) => e.event === 'Transfer');
        if (transferEvent) {
          console.log('Token ID:', transferEvent.args.tokenId.toString());
        }
        
      } catch (mintError: any) {
        console.error('Mint error:', mintError);
        throw mintError;
      }
      
      alert('Tạo NFT thành công!');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'Nghệ thuật',
      });
      setFile(null);
      setPreview('');
      setAttributes([]);
      
    } catch (error: any) {
      console.error('Error creating NFT:', error);
      alert(error.message || 'Tạo NFT thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!wallet.connected) {
    return (
      <div className="create-nft">
        <div className="container">
          <div className="connect-prompt">
            <h2>Kết nối ví của bạn</h2>
            <p>Vui lòng kết nối ví để tạo NFT</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-nft">
      <div className="container">
        <div className="create-header">
          <h1>Tạo NFT mới</h1>
          <p>Tải lên tài sản số và tạo thành NFT</p>
        </div>

        <form onSubmit={createNFT} className="create-form">
          <div className="form-section">
            <h3>Upload File</h3>
            <div className="file-upload">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="file-input"
                id="file-upload"
                required
              />
              <label htmlFor="file-upload" className="file-label">
                {preview ? (
                  <div className="preview">
                    {file?.type.startsWith('video/') ? (
                      <video src={preview} controls className="preview-media" />
                    ) : (
                      <img src={preview} alt="Preview" className="preview-media" />
                    )}
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📁</div>
                    <p>Click to upload file</p>
                    <p className="upload-hint">PNG, JPG, GIF, MP4 up to 100MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>NFT Details</h3>
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter NFT name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your NFT"
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Attributes (Optional)</h3>
            <p className="section-description">
              Add custom attributes to make your NFT more unique
            </p>
            
            {attributes.map((attr, index) => (
              <div key={index} className="attribute-row">
                <input
                  type="text"
                  placeholder="Trait type (e.g., Color)"
                  value={attr.trait_type}
                  onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Value (e.g., Blue)"
                  value={attr.value}
                  onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeAttribute(index)}
                  className="remove-btn"
                >
                  ✕
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addAttribute}
              className="add-attribute-btn"
            >
              + Add Attribute
            </button>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="create-btn"
            >
              {loading ? 'Creating NFT...' : 'Create NFT'}
            </button>
          </div>
        </form>

        {loading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <p>Creating your NFT...</p>
              <small>This may take a few minutes</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateNFT;
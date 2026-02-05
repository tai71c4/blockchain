import axios from 'axios';

const PINATA_API_KEY = '663dd4c67a8c0d8dbaba';
const PINATA_SECRET_API_KEY = 'c5b8db091485dfc34b10bc125f7236870d5cbfe169665d2b9372981f6e863d2a';
const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJkOTUxN2I3Mi1iOWUyLTQ4MWQtYmMwMy1jMDk4ZDQ2NzEwN2MiLCJlbWFpbCI6InRhaTMxMDcyMDA0b2tAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjY2M2RkNGM2N2E4YzBkOGRiYWJhIiwic2NvcGVkS2V5U2VjcmV0IjoiYzViOGRiMDkxNDg1ZGZjMzRiMTBiYzEyNWY3MjM2ODcwZDVjYmZlMTY5NjY1ZDJiOTM3Mjk4MWY2ZTg2M2QyYSIsImV4cCI6MTgwMTc1Mzc3N30.Bg7WikQVqvFY78BeK1s1zJ2yFQd2lNq-zpqkPVN_sSs';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export const uploadFileToIPFS = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data`,
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
      }
    );

    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw error;
  }
};

export const uploadMetadataToIPFS = async (metadata: NFTMetadata): Promise<string> => {
  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
      }
    );

    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw error;
  }
};

export const createNFTMetadata = (
  name: string,
  description: string,
  imageUrl: string,
  attributes: Array<{ trait_type: string; value: string }> = []
): NFTMetadata => {
  return {
    name,
    description,
    image: imageUrl,
    attributes,
  };
};
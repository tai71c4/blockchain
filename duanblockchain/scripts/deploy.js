const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("Deploying NFT Marketplace to Cronos Testnet...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await ethers.getSigners();
  
  if (!deployer) {
    console.error("No deployer account found. Check your private key in .env file");
    process.exit(1);
  }
  
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the contract
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  console.log("Deploying contract...");
  
  const nftMarketplace = await NFTMarketplace.deploy();
  console.log("Waiting for deployment...");
  
  await nftMarketplace.waitForDeployment();

  console.log("NFTMarketplace deployed to:", await nftMarketplace.getAddress());
  console.log("Transaction hash:", nftMarketplace.deploymentTransaction().hash);
  
  // Save contract address and ABI
  const fs = require('fs');
  const contractsDir = __dirname + "/../frontend/src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    contractsDir + "/contract-address.json",
    JSON.stringify({ NFTMarketplace: nftMarketplace.address }, undefined, 2)
  );

  const NFTMarketplaceArtifact = artifacts.readArtifactSync("NFTMarketplace");

  fs.writeFileSync(
    contractsDir + "/NFTMarketplace.json",
    JSON.stringify(NFTMarketplaceArtifact, null, 2)
  );

  console.log("Contract address and ABI saved to frontend/src/contracts/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
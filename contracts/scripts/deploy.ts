import { ethers } from "hardhat";

async function main() {
  console.log("Deploying BillboardMarket to Base Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const BillboardMarket = await ethers.getContractFactory("BillboardMarket");
  const contract = await BillboardMarket.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("BillboardMarket deployed to:", address);
  console.log("\nAdd this to your .env file:");
  console.log(`CONTRACT_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

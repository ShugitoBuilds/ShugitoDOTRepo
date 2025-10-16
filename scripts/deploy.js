const hre = require("hardhat");

async function main() {
  const [deployer, sustainabilityCandidate] = await hre.ethers.getSigners();
  const sustainabilityWallet =
    process.env.SUSTAINABILITY_WALLET ?? sustainabilityCandidate.address;

  console.log("Deploying GreenNFT with account:", deployer.address);
  console.log("Using sustainability wallet:", sustainabilityWallet);

  const baseURI = hre.config.greenNFT?.defaultBaseURI || "https://example.com/metadata/";

  const GreenNFT = await hre.ethers.getContractFactory("GreenNFT");
  const greenNFT = await GreenNFT.deploy("GreenNFT", "GNFT", baseURI, sustainabilityWallet);
  await greenNFT.waitForDeployment();

  console.log("GreenNFT deployed to:", await greenNFT.getAddress());
  console.log("Sustainability wallet:", sustainabilityWallet);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

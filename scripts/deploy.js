const hre = require("hardhat");

const DEFAULT_SUSTAINABILITY_WALLET =
  "0x4647c3b4c5ba4efa6d8197331de00c26ce36e8e6";

async function main() {
  let deployer;

  const signers = await hre.ethers.getSigners();
  if (signers.length > 0) {
    [deployer] = signers;
  } else {
    if (!process.env.PRIVATE_KEY) {
      throw new Error("No signer available. Set PRIVATE_KEY in your environment.");
    }
    deployer = new hre.ethers.Wallet(process.env.PRIVATE_KEY, hre.ethers.provider);
  }

  const sustainabilityWallet = (process.env.SUSTAINABILITY_WALLET || DEFAULT_SUSTAINABILITY_WALLET).trim();

  if (!hre.ethers.isAddress(sustainabilityWallet)) {
    throw new Error(
      `Configured sustainability wallet (${sustainabilityWallet}) is not a valid address. Set SUSTAINABILITY_WALLET in your environment.`
    );
  }

  if (!process.env.SUSTAINABILITY_WALLET) {
    console.log(
      `SUSTAINABILITY_WALLET not provided. Using default sustainability wallet ${DEFAULT_SUSTAINABILITY_WALLET}.`
    );
  }

  console.log("Deploying GreenNFT with account:", deployer.address);
  console.log("Network:", hre.network.name);
  console.log("Using sustainability wallet:", sustainabilityWallet);

  const baseURI = hre.config.greenNFT?.defaultBaseURI || "https://example.com/metadata/";

  const GreenNFT = await hre.ethers.getContractFactory("GreenNFT", deployer);
  const greenNFT = await GreenNFT.deploy("GreenNFT", "GNFT", baseURI, sustainabilityWallet);
  const deploymentTx = greenNFT.deploymentTransaction();
  await greenNFT.waitForDeployment();

  const contractAddress = await greenNFT.getAddress();

  console.log("GreenNFT deployed to:", contractAddress);
  if (deploymentTx?.hash) {
    console.log("Deployment transaction hash:", deploymentTx.hash);
  }
  console.log("Sustainability wallet:", sustainabilityWallet);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

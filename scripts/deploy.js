const hre = require("hardhat");

const DEFAULT_SUSTAINABILITY_WALLET =
  "0x4647c3b4c5ba4efa6d8197331de00c26ce36e8e6";

async function main() {
  let deployer;
  let sustainabilityCandidate;

  const signers = await hre.ethers.getSigners();
  if (signers.length > 0) {
    [deployer] = signers;
    sustainabilityCandidate = signers[1] ?? signers[0];
  } else {
    if (!process.env.PRIVATE_KEY) {
      throw new Error("No signer available. Set PRIVATE_KEY in your environment.");
    }
    deployer = new hre.ethers.Wallet(process.env.PRIVATE_KEY, hre.ethers.provider);
    sustainabilityCandidate = deployer;
  }

  const sustainabilityWallet =
    process.env.SUSTAINABILITY_WALLET ?? sustainabilityCandidate.address;

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

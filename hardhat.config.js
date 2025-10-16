require("@nomicfoundation/hardhat-toolbox");
require("@parity/hardhat-polkadot");

const DEFAULT_BASE_URI = "https://example.com/metadata/";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    local: {
      url: process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545",
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    sustainability: {
      default: 1,
    },
  },
  greenNFT: {
    defaultBaseURI: DEFAULT_BASE_URI,
  },
};

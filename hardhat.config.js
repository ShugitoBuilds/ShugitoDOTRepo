import dotenv from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
dotenv.config();

const { PRIVATE_KEY, MOONBASE_RPC } = process.env;

export default {
  solidity: "0.8.20",
  networks: {
    moonbase: {
      url: MOONBASE_RPC || "https://rpc.api.moonbase.moonbeam.network",
      chainId: 1287,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};

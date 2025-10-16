# GreenNFT

GreenNFT is a Solidity-based NFT smart contract tailored for eco-friendly initiatives. Every NFT mint donates 90% of the minting fee to a sustainability wallet while the remaining 10% is retained in the owner's treasury. The project targets the Polkadot development experience via the Parity smart-contracts devcontainer and uses Hardhat alongside the `@parity/hardhat-polkadot` plugin.

## Features
- ERC-721 compliant NFT contract with configurable base URI.
- Fixed mint price of `0.01` DOT-equivalent (represented as `0.01 ether`).
- Automatic split of mint proceeds: 90% to sustainability wallet, 10% to owner treasury.
- Owner controls sustainability wallet updates, treasury withdrawals, and metadata base URI updates.
- Transparent accounting through events and public getters for total donations and treasury balance.

## Project Structure
```
contracts/GreenNFT.sol   # Smart contract implementation
scripts/deploy.js        # Deployment helper for local nodes
hardhat.config.js        # Hardhat configuration with Parity plugin support
test/GreenNFT.test.js    # Hardhat unit tests
```

## Prerequisites
- Node.js 18+
- npm
- Access to the Parity smart-contracts devcontainer (already provisioned in this environment).

## Installation
Install project dependencies:
```bash
npm install
```

## Compilation
Compile the Solidity contracts:
```bash
npx hardhat compile
```

## Testing
Run the Hardhat unit tests:
```bash
npx hardhat test
```

## Deployment (Local Node)
Deploy the contract to a local EVM-compatible node (Hardhat network or the Parity devcontainer local node):
```bash
npx hardhat run scripts/deploy.js --network local
```

The deployment script prints both the deployed contract address and the sustainability wallet used. Override the sustainability wallet via environment variable if desired:
```bash
SUSTAINABILITY_WALLET=0xYourAddress npx hardhat run scripts/deploy.js --network local
```

## License
This project is released under the MIT License.

# GreenNFT

GreenNFT is a Solidity-based NFT smart contract tailored for eco-friendly initiatives. Every NFT mint donates 90% of the minting
 fee to a sustainability wallet while the remaining 10% is retained in the owner's treasury. The project targets the Polkadot de
velopment experience via the Parity smart-contracts devcontainer and uses Hardhat alongside the `@parity/hardhat-polkadot` plugi
n.

## Features
- ERC-721 compliant NFT contract with configurable base URI.
- Fixed mint price of `0.01` DOT-equivalent (represented as `0.01 ether`).
- Automatic split of mint proceeds: 90% to sustainability wallet, 10% to owner treasury.
- Sustainability wallet is immutable after deployment while the owner controls treasury withdrawals and metadata base URI updates.
- Integrated IPFS tooling to upload NFT assets and mint with decentralized metadata links.
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

Install the frontend dependencies (used for the React minter interface):
```bash
cd frontend
npm install
cd ..
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

Run the Solidity static analyzer:
```bash
npx hardhat check
```

Run Slither for a deeper security review (requires [`slither-analyzer`](https://github.com/crytic/slither) installed globally):
```bash
slither .
```

## Deployment (Local Node)
Deploy the contract to a local EVM-compatible node (Hardhat network or the Parity devcontainer local node):
```bash
npx hardhat run scripts/deploy.js --network local
```

The deployment script prints both the deployed contract address and the sustainability wallet used. By default it targets Moonbeam's sustainability wallet `0x4647c3b4c5ba4efa6d8197331de00c26ce36e8e6`. Override the sustainability wallet via environment variable if desired:
```bash
SUSTAINABILITY_WALLET=0xYourAddress npx hardhat run scripts/deploy.js --network local
```

## Connecting to Moonbase Alpha
1. Request testnet MOVR tokens from the [Moonbase Alpha Faucet](https://apps.moonbeam.network/moonbase-alpha/faucet).
2. In MetaMask (or another wallet), add the Moonbase Alpha network using:
   - **Network Name**: Moonbase Alpha
   - **RPC URL**: `https://rpc.api.moonbase.moonbeam.network`
   - **Chain ID**: `1287`
   - **Currency Symbol**: `DEV`
   - **Block Explorer**: `https://moonbase.moonscan.io/`
3. Export the private key for your funded Moonbase account and store it securely.
4. Create a `.env` file in the project root containing:
   ```bash
   PRIVATE_KEY=<your_test_wallet_private_key>
   MOONBASE_URL=https://rpc.api.moonbase.moonbeam.network
   # Optional – override the default Moonbeam sustainability wallet if required
   # SUSTAINABILITY_WALLET=0xYourAddress
   ```
5. Deploy to Moonbase Alpha once the account is funded:
   ```bash
   npx hardhat run scripts/deploy.js --network moonbase
   ```

The deployment script will print the contract address, the sustainability wallet used, and the deployment transaction hash once
the transaction is accepted by the network.

## IPFS Metadata Workflow

GreenNFT now supports decentralized metadata through IPFS.

### Upload assets from the command line

Use the bundled helper to push an image + metadata JSON template to IPFS:

```bash
npm run upload:metadata -- --metadata ./metadata/template.json --image ./assets/art.png --tokenId 1
```

- `--metadata` – path to a local JSON metadata template (name/description fields are merged with the generated image link).
- `--image` – path to the artwork file that will be uploaded and referenced in the metadata.
- `--tokenId` – optional hint used to name the metadata file (defaults to `metadata`).

The script prints the IPFS URI you can pass directly to the `mint` function or store for later use. Override the endpoint by setting `IPFS_API_URL` before running the script if you are using Pinata, NFT.Storage, or a self-hosted node.

### Set a collection-wide base URI

If you manage your own directory of metadata files (for example, `ipfs://<CID>/1.json`, `ipfs://<CID>/2.json`, …), update the base URI from the contract owner account:

```bash
npx hardhat console --network <network>
> const greenNFT = await ethers.getContractAt('GreenNFT', '0xContractAddress');
> await greenNFT.setBaseURI('ipfs://<directory-cid>/');
```

When `mint` is called without a metadata URI parameter, the contract falls back to `string.concat(baseURI, tokenId)`.

### Mint from the React frontend

1. Start the frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```
2. Connect your wallet and fill in the NFT name, description, and artwork image.
3. The UI uploads the metadata bundle to IPFS and automatically passes the resulting URI to the `mint` transaction.
4. Track the generated metadata URI directly in the UI and from the emitted `GreenNFTMinted` event.

## Security & Audit Checklist

Use the following checklist before promoting a deployment beyond testnet:

- [ ] ✅ Contracts compile cleanly via `npx hardhat compile`.
- [ ] ✅ Unit tests pass via `npx hardhat test`.
- [ ] ✅ Static analyzer passes via `npx hardhat check`.
- [ ] ✅ Slither shows no high/medium issues: `slither .` (install with `pip install slither-analyzer`).
- [ ] ✅ Review mint and withdrawal events to confirm expected fund routing.
- [ ] ✅ Confirm the immutable sustainability wallet and mint price match specification.
- [ ] ✅ Validate that owner treasury withdrawals go to a trusted address and follow the reentrancy-guarded flow.

## License
This project is released under the MIT License.

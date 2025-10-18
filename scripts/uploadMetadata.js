#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const process = require('process');

const usage = `\nUsage: node scripts/uploadMetadata.js --metadata <metadata.json> --image <image_file> [--tokenId <id>]\n\nOptions:\n  --metadata   Path to the metadata JSON template\n  --image      Path to the image asset referenced by the metadata\n  --tokenId    Optional token id used to name the metadata file (default: metadata)\n`;

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const value = argv[i + 1];
    args[key.slice(2)] = value;
    i += 1;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { ipfs } = await import('../utils/ipfs.js');
  const metadataPath = args.metadata;
  const imagePath = args.image;
  const tokenId = args.tokenId ?? 'metadata';

  if (!metadataPath || !imagePath) {
    console.error('Missing required arguments.');
    console.log(usage);
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(metadataPath)) {
    console.error(`Metadata file not found: ${metadataPath}`);
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(imagePath)) {
    console.error(`Image file not found: ${imagePath}`);
    process.exitCode = 1;
    return;
  }

  const metadataRaw = fs.readFileSync(metadataPath, 'utf8');
  let metadata;
  try {
    metadata = JSON.parse(metadataRaw);
  } catch (error) {
    console.error('Failed to parse metadata JSON:', error.message);
    process.exitCode = 1;
    return;
  }

  console.log('Uploading image to IPFS…');
  const imageFileName = path.basename(imagePath);
  const imageResult = await ipfs.add(
    {
      path: imageFileName,
      content: fs.createReadStream(imagePath)
    },
    { wrapWithDirectory: false }
  );
  const imageCID = imageResult.cid.toString();
  const imageURI = `ipfs://${imageCID}`;
  console.log(`Image uploaded: ${imageURI}`);

  const enrichedMetadata = {
    ...metadata,
    image: imageURI
  };

  console.log('Uploading metadata to IPFS…');
  const metadataFileName = `${tokenId}.json`;
  const metadataResult = await ipfs.add(
    {
      path: metadataFileName,
      content: Buffer.from(JSON.stringify(enrichedMetadata, null, 2), 'utf8')
    },
    { wrapWithDirectory: false }
  );

  const metadataCID = metadataResult.cid.toString();
  const metadataURI = `ipfs://${metadataCID}`;

  console.log('Upload complete!');
  console.log(`Image CID: ${imageCID}`);
  console.log(`Metadata CID: ${metadataCID}`);
  console.log(`Metadata URI: ${metadataURI}`);
  console.log('Store this URI for minting: ', metadataURI);
}

main().catch((error) => {
  console.error('Failed to upload assets to IPFS:', error);
  process.exitCode = 1;
});

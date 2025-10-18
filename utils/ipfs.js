import { create } from 'ipfs-http-client';

const defaultUrl = 'https://ipfs.io';
const envUrl = typeof process !== 'undefined' ? process.env?.IPFS_API_URL : undefined;

export const ipfs = create({ url: envUrl || defaultUrl });

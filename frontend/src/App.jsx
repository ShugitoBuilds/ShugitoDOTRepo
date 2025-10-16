import { useCallback, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import MintCard from './components/MintCard.jsx';
import WalletConnect from './components/WalletConnect.jsx';
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  NETWORK_NAME,
  DONATION_REFRESH_INTERVAL,
  MINT_PRICE
} from './config.js';

const formatError = (error) => {
  if (!error) return 'Unknown error';
  if (error.info?.error?.message) return error.info.error.message;
  if (error.shortMessage) return error.shortMessage;
  if (error.message) return error.message;
  return String(error);
};

const formatEtherValue = (value) => {
  try {
    return Number.parseFloat(ethers.formatEther(value ?? 0)).toFixed(4);
  } catch (err) {
    return '0.0000';
  }
};

function useContract(provider) {
  return useMemo(() => {
    if (!provider) return null;
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }, [provider]);
}

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  const [metadataURI, setMetadataURI] = useState('');
  const [status, setStatus] = useState(null);
  const [isMinting, setIsMinting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [totalDonated, setTotalDonated] = useState('0.0');
  const [donationLoading, setDonationLoading] = useState(false);

  const readOnlyProvider = useMemo(() => {
    if (!window.ethereum) return null;
    return new ethers.BrowserProvider(window.ethereum);
  }, []);

  const contract = useContract(signer ?? provider);

  const fetchDonationTotal = useCallback(async () => {
    if (!readOnlyProvider) return;
    setDonationLoading(true);
    try {
      const readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readOnlyProvider);
      const total = await readOnlyContract.getTotalDonated?.();
      const fallbackTotal = total ?? (await readOnlyContract.totalDonated());
      setTotalDonated(formatEtherValue(fallbackTotal));
    } catch (error) {
      console.error('Failed to fetch donation total', error);
      setStatus({ type: 'error', message: `Unable to fetch total donated: ${formatError(error)}` });
    } finally {
      setDonationLoading(false);
    }
  }, [readOnlyProvider]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setStatus({ type: 'error', message: 'No injected wallet found. Please install MetaMask or a Polkadot-EVM wallet.' });
      return;
    }

    try {
      setIsConnecting(true);
      setStatus({ type: 'info', message: 'Requesting wallet connection…' });
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const nextSigner = await browserProvider.getSigner();
      setProvider(browserProvider);
      setSigner(nextSigner);
      setAddress(accounts[0] ?? '');
      setStatus({ type: 'success', message: 'Wallet connected successfully.' });
      fetchDonationTotal();
    } catch (error) {
      setStatus({ type: 'error', message: `Wallet connection failed: ${formatError(error)}` });
    } finally {
      setIsConnecting(false);
    }
  }, [fetchDonationTotal]);

  const mintGreenNFT = useCallback(async () => {
    if (!contract) {
      setStatus({ type: 'error', message: 'Connect your wallet to mint.' });
      return;
    }

    setIsMinting(true);
    setStatus({ type: 'info', message: 'Minting transaction submitted…' });

    try {
      const value = ethers.parseEther(MINT_PRICE);
      const tx = await contract.mint({ value });
      const receipt = await tx.wait();
      setStatus({
        type: 'success',
        message: `Minted successfully! Thank you for supporting sustainability. Tx hash: ${receipt.hash}`
      });
      setMetadataURI('');
      fetchDonationTotal();
    } catch (error) {
      setStatus({ type: 'error', message: `Mint failed: ${formatError(error)}` });
    } finally {
      setIsMinting(false);
    }
  }, [contract, fetchDonationTotal, signer]);

  useEffect(() => {
    if (!window.ethereum) return undefined;

    const handleAccountsChanged = (accounts) => {
      const nextAddress = accounts[0] ?? '';
      setAddress(nextAddress);
      if (!nextAddress) {
        setSigner(null);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  useEffect(() => {
    fetchDonationTotal();
    if (!DONATION_REFRESH_INTERVAL) return undefined;

    const intervalId = setInterval(fetchDonationTotal, DONATION_REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchDonationTotal]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center gap-12">
        <WalletConnect address={address} onConnect={connectWallet} connecting={isConnecting} />
        <MintCard
          address={address}
          metadataURI={metadataURI}
          onMetadataChange={setMetadataURI}
          onMint={mintGreenNFT}
          isMinting={isMinting}
          totalDonated={totalDonated}
          donationLoading={donationLoading}
        />
        {metadataURI && (
          <div className="w-full max-w-xl text-sm text-slate-300 text-center">
            <p>
              Metadata reference saved locally: <span className="text-brand-light break-words">{metadataURI}</span>
            </p>
          </div>
        )}
        {status && (
          <div
            className={`w-full max-w-xl rounded-2xl border px-6 py-4 text-sm shadow-lg transition ${
              status.type === 'success'
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-100'
                : status.type === 'error'
                ? 'border-rose-500/60 bg-rose-500/10 text-rose-100'
                : 'border-sky-500/60 bg-sky-500/10 text-sky-100'
            }`}
          >
            <strong className="block mb-1 uppercase tracking-wide text-xs">
              {status.type === 'success' ? 'Success' : status.type === 'error' ? 'Error' : 'Status'}
            </strong>
            <span className="break-words">{status.message}</span>
          </div>
        )}
        <footer className="text-xs text-slate-500">
          Connected network: {NETWORK_NAME}
        </footer>
      </div>
    </div>
  );
}

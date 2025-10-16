import PropTypes from 'prop-types';
import { MINT_PRICE } from '../config.js';

export default function MintCard({
  address,
  metadataURI,
  onMetadataChange,
  onMint,
  isMinting,
  totalDonated,
  donationLoading
}) {
  const formattedDonation = totalDonated ?? '0.0000';

  return (
    <div className="w-full max-w-xl bg-slate-900/80 rounded-3xl shadow-xl border border-emerald-500/30 p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-light">GreenNFT Minter</h1>
        <p className="text-slate-300 mt-2">
          Each mint plants the seed for sustainability. 90% of your minting fee is donated automatically.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label htmlFor="metadata" className="text-sm uppercase tracking-wide text-slate-400">
          Metadata URI (optional)
        </label>
        <input
          id="metadata"
          type="text"
          placeholder="ipfs://..."
          value={metadataURI}
          onChange={(event) => onMetadataChange(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-brand focus:outline-none"
        />
        <p className="text-xs text-slate-400">
          The current smart contract mints using its configured baseURI. Use this field to track your metadata reference.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm uppercase tracking-wide text-slate-400">Total Donated</span>
        <span className="text-2xl font-semibold text-emerald-200">
          {donationLoading ? 'Loading…' : `${formattedDonation} ETH`}
        </span>
      </div>

      <button
        type="button"
        onClick={onMint}
        disabled={!address || isMinting}
        className="w-full py-3 rounded-full bg-gradient-to-r from-brand via-emerald-500 to-brand-light text-white font-semibold text-lg shadow-lg hover:shadow-brand-light/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isMinting ? 'Minting…' : `Mint GreenNFT (${MINT_PRICE} ETH)`}
      </button>

      <p className="text-xs text-slate-400">
        Requires a connected wallet with at least {MINT_PRICE} ETH on the selected network.
      </p>
    </div>
  );
}

MintCard.propTypes = {
  address: PropTypes.string,
  metadataURI: PropTypes.string.isRequired,
  onMetadataChange: PropTypes.func.isRequired,
  onMint: PropTypes.func.isRequired,
  isMinting: PropTypes.bool.isRequired,
  totalDonated: PropTypes.string,
  donationLoading: PropTypes.bool.isRequired
};

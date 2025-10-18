import PropTypes from 'prop-types';
import { MINT_PRICE } from '../config.js';

export default function MintCard({
  address,
  metadataName,
  metadataDescription,
  metadataURI,
  imageInputKey,
  imageName,
  onNameChange,
  onDescriptionChange,
  onImageChange,
  onMint,
  isMinting,
  isPreparingMetadata,
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

      <form className="flex flex-col gap-5" onSubmit={(event) => { event.preventDefault(); onMint(); }}>
        <div className="flex flex-col gap-3">
          <label htmlFor="name" className="text-sm uppercase tracking-wide text-slate-400">
            NFT Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Eco Warrior"
            value={metadataName}
            onChange={(event) => onNameChange(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-brand focus:outline-none"
            required
          />
        </div>

        <div className="flex flex-col gap-3">
          <label htmlFor="description" className="text-sm uppercase tracking-wide text-slate-400">
            Description
          </label>
          <textarea
            id="description"
            placeholder="Describe the sustainability impact of this collectible."
            value={metadataDescription}
            onChange={(event) => onDescriptionChange(event.target.value)}
            className="w-full min-h-[120px] rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 focus:border-brand focus:outline-none"
            required
          />
        </div>

        <div className="flex flex-col gap-3">
          <label htmlFor="image" className="text-sm uppercase tracking-wide text-slate-400">
            Artwork Image
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            key={imageInputKey}
            onChange={(event) => onImageChange(event.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-dashed border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 file:mr-4 file:rounded-md file:border-0 file:bg-brand/80 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            required
          />
          {imageName && <p className="text-xs text-slate-400">Selected file: {imageName}</p>}
        </div>

        {metadataURI && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            <strong className="block text-xs uppercase tracking-wide text-emerald-200 mb-1">Prepared Metadata</strong>
            <span className="break-words">{metadataURI}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!address || isMinting || isPreparingMetadata}
          className="w-full py-3 rounded-full bg-gradient-to-r from-brand via-emerald-500 to-brand-light text-white font-semibold text-lg shadow-lg hover:shadow-brand-light/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isMinting || isPreparingMetadata
            ? 'Uploading & Minting…'
            : `Mint GreenNFT (${MINT_PRICE} ETH)`}
        </button>
      </form>

      <div className="flex flex-col gap-2">
        <span className="text-sm uppercase tracking-wide text-slate-400">Total Donated</span>
        <span className="text-2xl font-semibold text-emerald-200">
          {donationLoading ? 'Loading…' : `${formattedDonation} ETH`}
        </span>
      </div>
      <p className="text-xs text-slate-400">
        Requires a connected wallet with at least {MINT_PRICE} ETH on the selected network.
      </p>
    </div>
  );
}

MintCard.propTypes = {
  address: PropTypes.string,
  metadataName: PropTypes.string.isRequired,
  metadataDescription: PropTypes.string.isRequired,
  metadataURI: PropTypes.string,
  imageInputKey: PropTypes.number.isRequired,
  imageName: PropTypes.string,
  onNameChange: PropTypes.func.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
  onImageChange: PropTypes.func.isRequired,
  onMint: PropTypes.func.isRequired,
  isMinting: PropTypes.bool.isRequired,
  isPreparingMetadata: PropTypes.bool.isRequired,
  totalDonated: PropTypes.string,
  donationLoading: PropTypes.bool.isRequired
};

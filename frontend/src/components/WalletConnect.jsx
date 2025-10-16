import PropTypes from 'prop-types';

export default function WalletConnect({ address, onConnect, connecting }) {
  const truncated = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onConnect}
        disabled={connecting}
        className="px-6 py-3 rounded-full bg-brand hover:bg-brand-light text-white font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {address ? 'Wallet Connected' : connecting ? 'Connecting…' : 'Connect Wallet'}
      </button>
      <p className="text-sm text-slate-200 min-h-[1.5rem]">
        {address ? `Connected: ${truncated}` : 'Connect to MetaMask or a Polkadot-EVM wallet to begin.'}
      </p>
    </div>
  );
}

WalletConnect.propTypes = {
  address: PropTypes.string,
  onConnect: PropTypes.func.isRequired,
  connecting: PropTypes.bool
};

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

/// @title GreenNFT - Eco-friendly NFT minting with automated donations
/// @notice Each mint routes 90% of the mint fee to a sustainability wallet and retains 10% for the owner treasury.
contract GreenNFT is ERC721, Ownable {
    /// @notice Price to mint a single NFT (0.01 ether represents 0.01 DOT equivalent in this environment)
    uint256 public constant MINT_PRICE = 0.01 ether;
    uint256 private _nextTokenId = 1;
    address payable private _sustainabilityWallet;
    string private _baseTokenURI;
    uint256 private _ownerTreasury;
    uint256 private _totalDonated;

    /// @notice Emitted when a new NFT is minted.
    /// @param minter The address that minted the NFT.
    /// @param tokenId The token identifier that was minted.
    /// @param donationAmount Amount forwarded to the sustainability wallet.
    /// @param ownerShare Amount retained by the contract treasury.
    event GreenNFTMinted(address indexed minter, uint256 indexed tokenId, uint256 donationAmount, uint256 ownerShare);

    /// @notice Emitted when a donation transfer is executed to the sustainability wallet.
    /// @param sustainabilityWallet Address receiving the donation.
    /// @param amount Amount transferred to the sustainability wallet.
    event DonationTransferred(address indexed sustainabilityWallet, uint256 amount);

    /// @notice Emitted when the sustainability wallet is updated.
    event SustainabilityWalletUpdated(address indexed previousWallet, address indexed newWallet);

    /// @notice Emitted when the base token URI is updated.
    event BaseURIUpdated(string previousBaseURI, string newBaseURI);

    /// @notice Emitted when the owner withdraws accumulated treasury funds.
    event OwnerFundsWithdrawn(address indexed recipient, uint256 amount);

    error GreenNFT__ZeroAddress();
    error GreenNFT__IncorrectMintPrice();
    error GreenNFT__NoFundsToWithdraw();

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address payable sustainabilityWallet_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        if (sustainabilityWallet_ == address(0)) {
            revert GreenNFT__ZeroAddress();
        }

        _sustainabilityWallet = sustainabilityWallet_;
        _baseTokenURI = baseURI_;
    }

    /// @notice Mint a new NFT by paying the exact mint price.
    function mint() external payable returns (uint256) {
        if (msg.value != MINT_PRICE) {
            revert GreenNFT__IncorrectMintPrice();
        }

        uint256 tokenId = _nextTokenId;
        unchecked {
            _nextTokenId = tokenId + 1;
        }

        _safeMint(msg.sender, tokenId);

        uint256 sustainabilityShare = (msg.value * 90) / 100;
        uint256 ownerShare = msg.value - sustainabilityShare;

        _ownerTreasury += ownerShare;
        _totalDonated += sustainabilityShare;

        Address.sendValue(_sustainabilityWallet, sustainabilityShare);

        emit DonationTransferred(_sustainabilityWallet, sustainabilityShare);
        emit GreenNFTMinted(msg.sender, tokenId, sustainabilityShare, ownerShare);

        return tokenId;
    }

    /// @notice Get the configured sustainability wallet address.
    function sustainabilityWallet() external view returns (address) {
        return _sustainabilityWallet;
    }

    /// @notice Return the total donated amount so far.
    function totalDonated() external view returns (uint256) {
        return _totalDonated;
    }

    /// @notice Backwards-compatible getter for the total donated amount.
    function getTotalDonated() external view returns (uint256) {
        return _totalDonated;
    }

    /// @notice Return the treasury balance accumulated for the owner.
    function ownerTreasury() external view returns (uint256) {
        return _ownerTreasury;
    }

    /// @notice Allow the owner to update the sustainability wallet address.
    function updateSustainabilityWallet(address payable newWallet) external onlyOwner {
        if (newWallet == address(0)) {
            revert GreenNFT__ZeroAddress();
        }

        address previousWallet = _sustainabilityWallet;
        _sustainabilityWallet = newWallet;

        emit SustainabilityWalletUpdated(previousWallet, newWallet);
    }

    /// @notice Withdraw accumulated owner treasury funds to a recipient.
    function withdrawOwnerFunds(address payable recipient) external onlyOwner {
        if (recipient == address(0)) {
            revert GreenNFT__ZeroAddress();
        }
        uint256 amount = _ownerTreasury;
        if (amount == 0) {
            revert GreenNFT__NoFundsToWithdraw();
        }

        _ownerTreasury = 0;
        Address.sendValue(recipient, amount);

        emit OwnerFundsWithdrawn(recipient, amount);
    }

    /// @notice Update the base token URI used for metadata.
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        string memory previousBaseURI = _baseTokenURI;
        _baseTokenURI = newBaseURI;

        emit BaseURIUpdated(previousBaseURI, newBaseURI);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /// @notice Allow the contract to receive funds (if any stray transfers occur).
    receive() external payable {
        _ownerTreasury += msg.value;
    }
}

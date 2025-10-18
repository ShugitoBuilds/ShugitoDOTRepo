// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        return a + b;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return a - b;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        return a * b;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return a / b;
    }
}

/// @title GreenNFT - Eco-friendly NFT minting with automated donations
/// @notice Each mint routes 90% of the mint fee to a sustainability wallet and retains 10% for the owner treasury.
contract GreenNFT is ERC721, Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using Strings for uint256;

    uint16 private constant BPS_DENOMINATOR = 10_000;

    uint16 private immutable i_donationBps;
    uint16 private immutable i_ownerBps;
    uint256 public immutable mintPrice;
    address payable public immutable sustainabilityWallet;

    uint256 private _nextTokenId = 1;
    string private _baseTokenURI;
    mapping(uint256 tokenId => string) private _tokenURIs;
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

    /// @notice Emitted when the base token URI is updated.
    event BaseURIUpdated(string previousBaseURI, string newBaseURI);

    /// @notice Emitted when the owner withdraws accumulated treasury funds.
    event OwnerFundsWithdrawn(address indexed recipient, uint256 amount);

    error GreenNFT__NoFundsToWithdraw();
    error GreenNFT__InvalidTokenURI();

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address payable sustainabilityWallet_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        require(sustainabilityWallet_ != address(0), "Invalid wallet");

        i_donationBps = 9_000;
        i_ownerBps = uint16(BPS_DENOMINATOR - i_donationBps);
        mintPrice = 0.01 ether;
        sustainabilityWallet = sustainabilityWallet_;
        _baseTokenURI = baseURI_;
    }

    /// @notice Mint a new NFT by paying the exact mint price.
    function mint(string memory metadataURI) external payable nonReentrant returns (uint256) {
        require(msg.value == mintPrice, "Incorrect payment");
        require(sustainabilityWallet != address(0), "Invalid wallet");

        uint256 tokenId = _nextTokenId;
        unchecked {
            _nextTokenId = tokenId + 1;
        }

        _safeMint(msg.sender, tokenId);

        if (bytes(metadataURI).length > 0) {
            _tokenURIs[tokenId] = metadataURI;
        } else if (bytes(_baseTokenURI).length == 0) {
            revert GreenNFT__InvalidTokenURI();
        }

        uint256 sustainabilityShare = msg.value.mul(i_donationBps).div(BPS_DENOMINATOR);
        uint256 ownerShare = msg.value.sub(sustainabilityShare);

        _ownerTreasury = _ownerTreasury.add(ownerShare);
        _totalDonated = _totalDonated.add(sustainabilityShare);

        Address.sendValue(sustainabilityWallet, sustainabilityShare);

        emit DonationTransferred(sustainabilityWallet, sustainabilityShare);
        emit GreenNFTMinted(msg.sender, tokenId, sustainabilityShare, ownerShare);

        return tokenId;
    }

    /// @notice Return the total donated amount so far.
    function totalDonated() external view returns (uint256) {
        return _totalDonated;
    }

    /// @notice Return the treasury balance accumulated for the owner.
    function ownerTreasury() external view returns (uint256) {
        return _ownerTreasury;
    }

    /// @notice Withdraw accumulated owner treasury funds to a recipient.
    function withdrawOwnerFunds(address payable recipient) external onlyOwner nonReentrant {
        require(recipient != address(0), "Invalid wallet");

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

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        string memory storedURI = _tokenURIs[tokenId];
        if (bytes(storedURI).length > 0) {
            return storedURI;
        }

        string memory baseURI = _baseTokenURI;
        if (bytes(baseURI).length == 0) {
            return "";
        }

        return string.concat(baseURI, tokenId.toString());
    }

    /// @notice Allow the contract to receive funds (if any stray transfers occur).
    receive() external payable {
        _ownerTreasury = _ownerTreasury.add(msg.value);
    }
}

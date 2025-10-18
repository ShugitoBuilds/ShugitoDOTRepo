const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GreenNFT", function () {
  const mintPrice = ethers.parseEther("0.01");
  const sustainabilityShare = (mintPrice * 90n) / 100n;
  const ownerShare = mintPrice - sustainabilityShare;

  let owner;
  let sustainability;
  let user;
  let other;
  let greenNFT;

  async function deployContract(sustainabilityAddress) {
    const GreenNFT = await ethers.getContractFactory("GreenNFT");
    const contract = await GreenNFT.deploy(
      "GreenNFT",
      "GNFT",
      "https://example.com/base/",
      sustainabilityAddress
    );
    await contract.waitForDeployment();
    return contract;
  }

  beforeEach(async function () {
    [owner, sustainability, user, other] = await ethers.getSigners();
    greenNFT = await deployContract(sustainability.address);
  });

  describe("deployment", function () {
    it("stores constructor arguments", async function () {
      expect(await greenNFT.sustainabilityWallet()).to.equal(sustainability.address);
      expect(await greenNFT.owner()).to.equal(owner.address);
      expect(await greenNFT.ownerTreasury()).to.equal(0n);
      expect(await greenNFT.totalDonated()).to.equal(0n);
    });

    it("reverts when sustainability wallet is zero", async function () {
      const GreenNFT = await ethers.getContractFactory("GreenNFT");
      await expect(
        GreenNFT.deploy("GreenNFT", "GNFT", "https://example.com/base/", ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid wallet");
    });
  });

  describe("minting", function () {
    const sampleURI = "ipfs://sample-cid";

    it("reverts when incorrect payment is supplied", async function () {
      await expect(greenNFT.connect(user).mint(sampleURI, { value: mintPrice - 1n })).to.be.revertedWith(
        "Incorrect payment"
      );
    });

    it("mints successfully, transfers ownership, and distributes fees", async function () {
      await expect(() => greenNFT.connect(user).mint(sampleURI, { value: mintPrice }))
        .to.changeEtherBalances([user, sustainability, greenNFT], [-mintPrice, sustainabilityShare, ownerShare]);

      expect(await greenNFT.ownerOf(1n)).to.equal(user.address);
      expect(await greenNFT.ownerTreasury()).to.equal(ownerShare);
      expect(await greenNFT.totalDonated()).to.equal(sustainabilityShare);
      expect(await greenNFT.tokenURI(1n)).to.equal(sampleURI);
    });

    it("emits events for minting and donation", async function () {
      await expect(greenNFT.connect(user).mint(sampleURI, { value: mintPrice }))
        .to.emit(greenNFT, "DonationTransferred")
        .withArgs(sustainability.address, sustainabilityShare)
        .and.to.emit(greenNFT, "GreenNFTMinted")
        .withArgs(user.address, 1n, sustainabilityShare, ownerShare);
    });

    it("falls back to base URI when metadata is omitted", async function () {
      await expect(greenNFT.connect(user).mint("", { value: mintPrice })).not.to.be.reverted;
      expect(await greenNFT.tokenURI(1n)).to.equal("https://example.com/base/1");
    });

    it("reverts when no metadata is provided and base URI is empty", async function () {
      await greenNFT.connect(owner).setBaseURI("");
      await expect(greenNFT.connect(user).mint("", { value: mintPrice })).to.be.revertedWithCustomError(
        greenNFT,
        "GreenNFT__InvalidTokenURI"
      );
    });
  });

  describe("security", function () {
    beforeEach(async function () {
      await greenNFT.connect(user).mint("ipfs://metadata", { value: mintPrice });
    });

    it("rejects owner withdrawals from non-owner accounts", async function () {
      await expect(greenNFT.connect(user).withdrawOwnerFunds(user.address))
        .to.be.revertedWithCustomError(greenNFT, "OwnableUnauthorizedAccount")
        .withArgs(user.address);
    });

    it("reverts when withdrawing without funds", async function () {
      await greenNFT.connect(owner).withdrawOwnerFunds(owner.address);
      await expect(greenNFT.connect(owner).withdrawOwnerFunds(owner.address)).to.be.revertedWithCustomError(
        greenNFT,
        "GreenNFT__NoFundsToWithdraw"
      );
    });

    it("prevents reentrancy during withdrawals", async function () {
      const Reentrant = await ethers.getContractFactory("ReentrantWithdrawer");
      const reentrant = await Reentrant.deploy(greenNFT.target);
      await reentrant.waitForDeployment();

      await greenNFT.connect(owner).transferOwnership(reentrant.target);

      await expect(reentrant.attack()).to.not.be.reverted;
      expect(await greenNFT.ownerTreasury()).to.equal(0n);
      expect(await ethers.provider.getBalance(greenNFT.target)).to.equal(0n);

      const contractBalance = await ethers.provider.getBalance(reentrant.target);
      expect(contractBalance).to.equal(ownerShare);

      await expect(() => reentrant.sweep(owner.address)).to.changeEtherBalances(
        [reentrant, owner],
        [-ownerShare, ownerShare]
      );
    });
  });
});

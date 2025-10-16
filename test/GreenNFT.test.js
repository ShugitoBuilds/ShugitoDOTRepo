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
      expect(await greenNFT.getTotalDonated()).to.equal(0n);
    });

    it("reverts when sustainability wallet is zero", async function () {
      const GreenNFT = await ethers.getContractFactory("GreenNFT");
      await expect(
        GreenNFT.deploy("GreenNFT", "GNFT", "https://example.com/base/", ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(GreenNFT, "GreenNFT__ZeroAddress");
    });
  });

  describe("minting", function () {
    it("reverts when incorrect payment is supplied", async function () {
      await expect(greenNFT.connect(user).mint({ value: mintPrice - 1n })).to.be.revertedWithCustomError(
        greenNFT,
        "GreenNFT__IncorrectMintPrice"
      );
    });

    it("mints successfully, transfers ownership, and distributes fees", async function () {
      await expect(() => greenNFT.connect(user).mint({ value: mintPrice }))
        .to.changeEtherBalances([user, sustainability, greenNFT], [-mintPrice, sustainabilityShare, ownerShare]);

      expect(await greenNFT.ownerOf(1n)).to.equal(user.address);
      expect(await greenNFT.ownerTreasury()).to.equal(ownerShare);
      expect(await greenNFT.totalDonated()).to.equal(sustainabilityShare);
      expect(await greenNFT.getTotalDonated()).to.equal(sustainabilityShare);
    });

    it("emits events for minting and donation", async function () {
      await expect(greenNFT.connect(user).mint({ value: mintPrice }))
        .to.emit(greenNFT, "DonationTransferred")
        .withArgs(sustainability.address, sustainabilityShare)
        .and.to.emit(greenNFT, "GreenNFTMinted")
        .withArgs(user.address, 1n, sustainabilityShare, ownerShare);
    });
  });

  describe("administrative actions", function () {
    beforeEach(async function () {
      await greenNFT.connect(user).mint({ value: mintPrice });
    });

    it("allows the owner to update the sustainability wallet", async function () {
      await expect(greenNFT.connect(owner).updateSustainabilityWallet(other.address))
        .to.emit(greenNFT, "SustainabilityWalletUpdated")
        .withArgs(sustainability.address, other.address);

      expect(await greenNFT.sustainabilityWallet()).to.equal(other.address);
    });

    it("reverts when sustainability wallet is updated to zero address", async function () {
      await expect(
        greenNFT.connect(owner).updateSustainabilityWallet(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(greenNFT, "GreenNFT__ZeroAddress");
    });

    it("allows the owner to withdraw accumulated funds", async function () {
      await expect(() => greenNFT.connect(owner).withdrawOwnerFunds(owner.address)).to.changeEtherBalances(
        [greenNFT, owner],
        [-ownerShare, ownerShare]
      );

      expect(await greenNFT.ownerTreasury()).to.equal(0n);
    });

    it("reverts when withdrawing with zero address", async function () {
      await expect(
        greenNFT.connect(owner).withdrawOwnerFunds(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(greenNFT, "GreenNFT__ZeroAddress");
    });

    it("reverts when withdrawing without funds", async function () {
      await greenNFT.connect(owner).withdrawOwnerFunds(owner.address);
      await expect(greenNFT.connect(owner).withdrawOwnerFunds(owner.address)).to.be.revertedWithCustomError(
        greenNFT,
        "GreenNFT__NoFundsToWithdraw"
      );
    });
  });
});

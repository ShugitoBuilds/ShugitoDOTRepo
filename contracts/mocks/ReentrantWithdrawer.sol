// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {GreenNFT} from "../GreenNFT.sol";

contract ReentrantWithdrawer {
    GreenNFT private immutable _greenNFT;

    constructor(GreenNFT greenNFT_) {
        _greenNFT = greenNFT_;
    }

    function attack() external {
        _greenNFT.withdrawOwnerFunds(payable(address(this)));
    }

    function sweep(address payable recipient) external {
        require(recipient != address(0), "Invalid recipient");
        (bool success, ) = recipient.call{value: address(this).balance}("");
        require(success, "Sweep failed");
    }

    receive() external payable {
        try _greenNFT.withdrawOwnerFunds(payable(address(this))) {
            // Intentionally empty - probing reentrancy protection.
        } catch {
            // Swallow reverts so the original call can proceed.
        }
    }
}

// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

interface IRespondent{
    function target(uint256, address, string calldata) external;
}

contract Caller {

    function call(address respondent, bytes calldata payload) public {
        (bool success, ) = respondent.call(payload);
        require(success);
    }
}
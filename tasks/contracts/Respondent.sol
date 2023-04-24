// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

contract Respondent {
    uint256 number;
    string str; 
    address adr;

    event eventCall(uint256 indexed number, address indexed adr, string str);

    function target(uint256 _number, address _adr, string calldata _str) public {
        number = _number;
        str = _str;
        adr = _adr;
        emit eventCall(_number, _adr, _str);
    }
}
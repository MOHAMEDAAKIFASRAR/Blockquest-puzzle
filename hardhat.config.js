require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: ["0x6c2a94fdbb17e8b1426edf03419230987b758a21e854a7824aa924bc84c4862a"],
    },
  },
  solidity: "0.8.20",
};

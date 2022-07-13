import { ethers } from "hardhat";

async function main() {
  const nonce = "HELLO";
  const number = "689";
  const GuessNumber = await ethers.getContractFactory("GuessNumber");
  const guessNumber = await GuessNumber.deploy(
    ethers.utils.keccak256(ethers.utils.formatBytes32String(nonce)),
    ethers.utils.keccak256(
      ethers.utils.hexConcat([
        ethers.utils.formatBytes32String(nonce),
        ethers.utils.hexlify(number),
      ])
    ),
    2,
    {
      value: 1,
    }
  );
  console.log("Lock with 1 wei deployed to:", guessNumber.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const TOKEN_HOLDER = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621";

  await helpers.impersonateAccount(TOKEN_HOLDER);
  const impersonatedSigner = await ethers.getSigner(TOKEN_HOLDER);

  const amountUSDCDesired = ethers.parseUnits("1000", 6); // 1000 USDC
  const amountDAIDesired = ethers.parseUnits("1000", 18); // 1000 DAI
  const amountUSDCMin = ethers.parseUnits("990", 6); // 990 USDC
  const amountDAIMin = ethers.parseUnits("990", 18); // 990 DAI

  const USDC_Contract = await ethers.getContractAt("IERC20", USDC, impersonatedSigner);
  const DAI_Contract = await ethers.getContractAt("IERC20", DAI, impersonatedSigner);
  const ROUTER = await ethers.getContractAt("IUniswapV2Router", ROUTER_ADDRESS, impersonatedSigner);

  // Approve router to spend tokens
  await USDC_Contract.approve(ROUTER_ADDRESS, amountUSDCDesired);
  await DAI_Contract.approve(ROUTER_ADDRESS, amountDAIDesired);

  const usdcBalBefore = await USDC_Contract.balanceOf(impersonatedSigner.address);
  const daiBalBefore = await DAI_Contract.balanceOf(impersonatedSigner.address);

  console.log("USDC balance before adding liquidity:", ethers.formatUnits(usdcBalBefore, 6));
  console.log("DAI balance before adding liquidity:", ethers.formatUnits(daiBalBefore, 18));

  const deadline = Math.floor(Date.now() / 1000) + (60 * 10); // 10 minutes from now

  // Add liquidity
  const tx = await ROUTER.addLiquidity(
    USDC,
    DAI,
    amountUSDCDesired,
    amountDAIDesired,
    amountUSDCMin,
    amountDAIMin,
    impersonatedSigner.address,
    deadline
  );

  await tx.wait();

  const usdcBalAfter = await USDC_Contract.balanceOf(impersonatedSigner.address);
  const daiBalAfter = await DAI_Contract.balanceOf(impersonatedSigner.address);

  console.log("=========================================================");
  console.log("USDC balance after adding liquidity:", ethers.formatUnits(usdcBalAfter, 6));
  console.log("DAI balance after adding liquidity:", ethers.formatUnits(daiBalAfter, 18));

  console.log("USDC used:", ethers.formatUnits(usdcBalBefore - usdcBalAfter, 6));
  console.log("DAI used:", ethers.formatUnits(daiBalBefore - daiBalAfter, 18));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
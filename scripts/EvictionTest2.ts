import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const TOKEN_HOLDER = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621";
  const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

  await helpers.impersonateAccount(TOKEN_HOLDER);
  const impersonatedSigner = await ethers.getSigner(TOKEN_HOLDER);

  const USDC_Contract = await ethers.getContractAt("IERC20", USDC, impersonatedSigner);
  const DAI_Contract = await ethers.getContractAt("IERC20", DAI, impersonatedSigner);
  const ROUTER = await ethers.getContractAt("IUniswapV2Router", ROUTER_ADDRESS, impersonatedSigner);
  const FACTORY = await ethers.getContractAt("IUniswapV2Factory", FACTORY_ADDRESS, impersonatedSigner);

  // Get initial balances
  const initialUSDCBal = await USDC_Contract.balanceOf(impersonatedSigner.address);
  const initialDAIBal = await DAI_Contract.balanceOf(impersonatedSigner.address);

  console.log("Initial USDC balance:", ethers.formatUnits(initialUSDCBal, 6));
  console.log("Initial DAI balance:", ethers.formatUnits(initialDAIBal, 18));

  // Add Liquidity
  console.log("\nAdding Liquidity...");

  const amountUSDCToAdd = ethers.parseUnits("1000", 6); // 1000 USDC
  const amountDAIToAdd = ethers.parseUnits("1000", 18); // 1000 DAI
  const amountUSDCMin = ethers.parseUnits("990", 6); // 990 USDC
  const amountDAIMin = ethers.parseUnits("990", 18); // 990 DAI

  // Approve router to spend tokens
  await USDC_Contract.approve(ROUTER_ADDRESS, amountUSDCToAdd);
  await DAI_Contract.approve(ROUTER_ADDRESS, amountDAIToAdd);

  let deadline = Math.floor(Date.now() / 1000) + (60 * 10); // 10 minutes from now

  // Add liquidity
  let tx = await ROUTER.addLiquidity(
    USDC,
    DAI,
    amountUSDCToAdd,
    amountDAIToAdd,
    amountUSDCMin,
    amountDAIMin,
    impersonatedSigner.address,
    deadline
  );

  await tx.wait();

  // Get balances after adding liquidity
  const usdcBalAfterAdd = await USDC_Contract.balanceOf(impersonatedSigner.address);
  const daiBalAfterAdd = await DAI_Contract.balanceOf(impersonatedSigner.address);

  console.log("USDC balance after adding liquidity:", ethers.formatUnits(usdcBalAfterAdd, 6));
  console.log("DAI balance after adding liquidity:", ethers.formatUnits(daiBalAfterAdd, 18));
  console.log("USDC added:", ethers.formatUnits(initialUSDCBal - usdcBalAfterAdd, 6));
  console.log("DAI added:", ethers.formatUnits(initialDAIBal - daiBalAfterAdd, 18));

  // Remove Liquidity
  console.log("\nRemoving Liquidity...");

  const pairAddress = await FACTORY.getPair(USDC, DAI);
  const PAIR = await ethers.getContractAt("IUniswapV2Pair", pairAddress, impersonatedSigner);

  const liquidityBalance = await PAIR.balanceOf(impersonatedSigner.address);
  console.log("Current liquidity balance:", ethers.formatUnits(liquidityBalance, 18));

  const liquidityToRemove = liquidityBalance / 2n;
  const amountUSDCMinRemove = ethers.parseUnits("100", 6);
  const amountDAIMinRemove = ethers.parseUnits("100", 18);

  // Approve the router to spend the liquidity tokens
  await PAIR.approve(ROUTER_ADDRESS, liquidityToRemove);

  deadline = Math.floor(Date.now() / 1000) + (60 * 10); // 10 minutes from now

  // Remove liquidity
  tx = await ROUTER.removeLiquidity(
    USDC,
    DAI,
    liquidityToRemove,
    amountUSDCMinRemove,
    amountDAIMinRemove,
    impersonatedSigner.address,
    deadline
  );

  await tx.wait();

  const usdcBalAfterRemove = await USDC_Contract.balanceOf(impersonatedSigner.address);
  const daiBalAfterRemove = await DAI_Contract.balanceOf(impersonatedSigner.address);

  console.log("=========================================================");
  console.log("USDC balance after removing liquidity:", ethers.formatUnits(usdcBalAfterRemove, 6));
  console.log("DAI balance after removing liquidity:", ethers.formatUnits(daiBalAfterRemove, 18));
  console.log("USDC received:", ethers.formatUnits(usdcBalAfterRemove - usdcBalAfterAdd, 6));
  console.log("DAI received:", ethers.formatUnits(daiBalAfterRemove - daiBalAfterAdd, 18));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
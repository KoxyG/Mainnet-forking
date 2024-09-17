import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const TOKEN_HOLDER = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621";

  await helpers.impersonateAccount(TOKEN_HOLDER);
  const impersonatedSigner = await ethers.getSigner(TOKEN_HOLDER);

  const amountIn = ethers.parseUnits("100", 6); // 100 USDC
  const amountOutMin = ethers.parseUnits("95", 18); // Expect at least 95 DAI

  const USDC_Contract = await ethers.getContractAt("IERC20", USDC, impersonatedSigner);
  const DAI_Contract = await ethers.getContractAt("IERC20", DAI);
  const ROUTER = await ethers.getContractAt("IUniswapV2Router", ROUTER_ADDRESS, impersonatedSigner);

  await USDC_Contract.approve(ROUTER_ADDRESS, amountIn);

  const usdcBal = await USDC_Contract.balanceOf(impersonatedSigner.address);
  const daiBal = await DAI_Contract.balanceOf(impersonatedSigner.address);

  const deadline = Math.floor(Date.now() / 1000) + (60 * 10);

  console.log("USDC balance before swap", ethers.formatUnits(usdcBal, 6));
  console.log("DAI balance before swap", ethers.formatUnits(daiBal, 18));

  await ROUTER.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    [USDC, DAI],
    impersonatedSigner.address,
    deadline
  );

  const usdcBalAfter = await USDC_Contract.balanceOf(impersonatedSigner.address);
  const daiBalAfter = await DAI_Contract.balanceOf(impersonatedSigner.address);

  console.log("=========================================================");
  console.log("USDC balance after swap", ethers.formatUnits(usdcBalAfter, 6));
  console.log("DAI balance after swap", ethers.formatUnits(daiBalAfter, 18));
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
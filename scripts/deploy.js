const hre = require("hardhat");

async function main() {
  const PuzzleGame = await hre.ethers.getContractFactory("PuzzleGame");
  const puzzleGame = await PuzzleGame.deploy(); // No need for .deployed()

  await puzzleGame.waitForDeployment(); // Wait for deployment to finish

  console.log("✅ PuzzleGame deployed to:", await puzzleGame.getAddress());
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});

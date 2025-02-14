// File: scripts/deploy.js
async function main() {
  // Get the deployer's account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get the contract factory and deploy the MerkleVerifier contract
  const MerkleVerifier = await ethers.getContractFactory("MerkleVerifier");
  const merkleVerifier = await MerkleVerifier.deploy();

  await merkleVerifier.deployed();
  console.log("MerkleVerifier deployed to:", merkleVerifier.address);
}

// Execute the script and catch errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

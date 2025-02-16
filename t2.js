const unlockAndBurn = useCallback(async () => {
    setErrorMessage("");
  
    // Check that required values are available.
    // Note: We assume that `nft.transferId` was saved from the previous lock/wrap operation.
    if (!nft.identifier || !provider || !nft.contract || !nft.transferId) {
      setErrorMessage(
        "Token id, NFT contract address, transfer id or provider is missing."
      );
      return;
    }
  
    setIsLoading(true);
    // Create a pending transaction record for unlocking/burning.
    const pendingRecord = await insertTransactionRecord({
      type: "Burn on CARDONA and Unlock on Chain A",
      tokenId: nft.identifier,
      status: "Pending",
      sender: userAddress,
      receiver: userAddress,
      timestamp: Date.now(),
    });
  
    try {
      // --- PART 1: Burn Wrapped NFT on CARDONA ---
      // Switch to CARDONA network where the minting (wrapped NFT) contract is deployed.
      await switchToChain(selectedChain);
      const signerCardona = await provider.getSigner();
  
      // Create an instance of the minting contract.
      const destinationContract = new Contract(
        CONSTANTS.CHAIN_CONFIG[selectedChain].destination_contract,
        MINTING_CONTRACT_ABI,
        signerCardona
      );
  
      // Burn the wrapped NFT.
      const burnTx = await destinationContract.burnWrappedNFT(
        nft.identifier,
        nft.transferId,
        { gasLimit: 500000 }
      );
      await burnTx.wait();
  
      // --- PART 2: Unlock Original NFT on Chain A ---
      // Switch back to Chain A where the locking contract is deployed.
      await switchToChain(sourceChain);
      const signer = await provider.getSigner();
  
      // Create an instance of the locking contract.
      const lockingContract = new Contract(
        CONSTANTS.CHAIN_CONFIG[sourceChain].source_contract,
        LOCKING_CONTRACT_ABI,
        signer
      );
  
      // Unlock the original NFT using the same transferId.
      const unlockTx = await lockingContract.unlockNFT(nft.transferId, {
        gasLimit: 500000,
      });
      await unlockTx.wait();
  
      // Record the successful transaction details in your app.
      addTransaction({
        burnHash: burnTx.hash,
        unlockHash: unlockTx.hash,
        timestamp: Date.now(),
        sender: userAddress,
        receiver: userAddress,
        tokenId: nft.identifier,
        type: "Burn on CARDONA and Unlock on Chain A",
        status: "Completed",
      });
      if (pendingRecord?.id) {
        await updateTransactionRecord(pendingRecord.id, {
          burnHash: burnTx.hash,
          unlockHash: unlockTx.hash,
          status: "Completed",
        });
      }
  
      alert(
        "Wrapped NFT burned on CARDONA and original NFT unlocked on Chain A successfully!"
      );
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(decodeError(error as ContractError));
      if (pendingRecord?.id) {
        await updateTransactionRecord(pendingRecord.id, { status: "Failed" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    nft.identifier,
    nft.contract,
    nft.transferId, // Ensure transferId is available from your wrapped NFT data
    provider,
    userAddress,
    insertTransactionRecord,
    updateTransactionRecord,
    switchToChain,
    addTransaction,
  ]);
  
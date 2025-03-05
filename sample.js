import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction
  } from "@solana/web3.js";
  import {
    getAccount,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction
  } from "@solana/spl-token";
  import bs58 from "bs58";
  
  // Replace with your actual base58 private key
  const BASE58_PRIVATE_KEY = "REPLACE_WALLET_PRIVATE_KEY";
  const SENDER_PRIVATE_KEY = bs58.decode(BASE58_PRIVATE_KEY);
  const senderKeypair = Keypair.fromSecretKey(SENDER_PRIVATE_KEY);
  
  console.log("Sender Public Key:", senderKeypair.publicKey.toBase58());
  
  // RPC Endpoint (use devnet/mainnet accordingly)
  const RPC_ENDPOINT = "https://api.devnet.solana.com";
  const connection = new Connection(RPC_ENDPOINT, "confirmed");
  
  // Replace with recipient's wallet address
  const recipientAddress = new PublicKey("REPLACE_RECEIVER_ADDRESS");
  
  // Replace with the SPL Token mint address
  const tokenMintAddress = new PublicKey("REPLACE_TOKEN_CONTRACT_ADDRESS");
  
  // Amount to send (adjust for token decimals)
  const amount = 888 * 1_000_000; // Example: assuming 6 decimals
  
  async function sendToken() {
    try {
      // Get sender's associated token account
      const senderTokenAccount = await getAssociatedTokenAddress(tokenMintAddress, senderKeypair.publicKey);
      
      // Ensure sender's token account exists
      try {
        await getAccount(connection, senderTokenAccount);
      } catch (error) {
        console.error("Error: Sender token account does not exist or is uninitialized.");
        return;
      }
  
      // Get recipient's associated token account
      const recipientTokenAccount = await getAssociatedTokenAddress(tokenMintAddress, recipientAddress);
      let transaction = new Transaction();
      
      // Ensure recipient's token account exists, create if not
      try {
        await getAccount(connection, recipientTokenAccount);
      } catch (error) {
        console.log("Recipient token account does not exist. Creating one...");
        transaction.add(
          createAssociatedTokenAccountInstruction(
            senderKeypair.publicKey, // Payer
            recipientTokenAccount, // Associated Token Account
            recipientAddress, // Owner
            tokenMintAddress // Token Mint
          )
        );
      }
  
      // Create transfer instruction
      transaction.add(
        createTransferInstruction(
          senderTokenAccount,
          recipientTokenAccount,
          senderKeypair.publicKey,
          amount
        )
      );
      
      // Fetch latest blockhash
      transaction.feePayer = senderKeypair.publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  
      // Sign and send transaction
      const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);
      console.log("Transaction Signature:", signature);
    } catch (error) {
      console.error("Error sending token:", error);
    }
}
  
sendToken();
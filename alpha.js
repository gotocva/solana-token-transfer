
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import bs58 from "bs58"; // Install: npm install bs58

// Base58 encoded private key (replace with your actual key)
const BASE58_PRIVATE_KEY = "WALLET_PRIVATE_KEY";
const SENDER_PRIVATE_KEY = bs58.decode(BASE58_PRIVATE_KEY);
const senderKeypair = Keypair.fromSecretKey(SENDER_PRIVATE_KEY);

console.log("Public Key:", senderKeypair.publicKey.toBase58());

// Solana RPC Endpoint
const connection = new Connection(clusterApiUrl('mainnet-beta'), "confirmed");

// Replace with recipient's wallet address
const recipientAddress = new PublicKey("5bfF4i9d2XUAdjC7uZqw6epQq3X54wFTd6BoaW3ZKSxS");

// Replace with the SPL Token mint address
const tokenMintAddress = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");

// Amount to send (adjust for token decimals)
const amount = 0.1 * 1_000_000; // Modify this based on token decimals

async function sendToken() {
  try {
    // Get associated token accounts (explicitly specifying TOKEN_PROGRAM_ID and ASSOCIATED_TOKEN_PROGRAM_ID)
    const senderTokenAccount = await getAssociatedTokenAddress(
      tokenMintAddress,
      senderKeypair.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const recipientTokenAccount = await getAssociatedTokenAddress(
      tokenMintAddress,
      recipientAddress,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    console.log(`Sender Token Account: ${senderTokenAccount.toBase58()}`);
    console.log(`Recipient Token Account: ${recipientTokenAccount.toBase58()}`);

    const transaction = new Transaction();

    // Check if sender's token account exists
    try {
      await getAccount(connection, senderTokenAccount);
    } catch (err) {
      console.log("Sender token account does not exist. Creating one...");
      transaction.add(
        createAssociatedTokenAccountInstruction(
          senderKeypair.publicKey, // Payer
          senderTokenAccount, // Token account
          senderKeypair.publicKey, // Owner
          tokenMintAddress, // Token mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    // Check if recipient's token account exists
    try {
      await getAccount(connection, recipientTokenAccount);
    } catch (err) {
      console.log("Recipient token account does not exist. Creating one...");
      transaction.add(
        createAssociatedTokenAccountInstruction(
          senderKeypair.publicKey, // Payer
          recipientTokenAccount, // Token account
          recipientAddress, // Owner
          tokenMintAddress, // Token mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    // Create transfer instruction
    transaction.add(
      createTransferInstruction(
        senderTokenAccount, // Source token account
        recipientTokenAccount, // Destination token account
        senderKeypair.publicKey, // Owner of the source account
        amount,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    transaction.feePayer = senderKeypair.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    // Sign and send transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      senderKeypair,
    ]);
    console.log("Transaction Signature:", signature);
  } catch (error) {
    console.error("Error sending token:", error);
  }
}

sendToken();


import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import * as BufferLayout from "@solana/buffer-layout";
import fs from "mz/fs";
import os from "os";
import path from "path";

/*
 * 1. Define global variables
 */
const PROGRAM_NAME = "transfer";
const SOLANA_NETWORK = "http://localhost:8899";

let connection: Connection;
let programKeypair: Keypair;
let programId: PublicKey;

let user1Keypair: Keypair;
let user2Keypair: Keypair;
let user3Keypair: Keypair;
let user4Keypair: Keypair;
let user1Balance: number;
let user2Balance: number;
let user3Balance: number;
let user4Balance: number;

/*
 * 2. Helper functions
 */
function createKeypairFromFile(filepath: string): Keypair {
  return Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(filepath, "utf-8")))
  );
}

async function sendLamports(from: Keypair, to: PublicKey, amount: number) {
  // Q: How could we have this send some other SPL token? E.g., FOXY
  // Q: Would other SPL Tokens use this same method? Would the
  // instructions data be the same? Or how does that look?
  // Create the instructions data BufferLayout to represent
  // our instructions data inside the Transaction
  let data = Buffer.alloc(8); // 8 bytes to represent a number in lamports
  // Serialize the data into our Buffer
  // Q: Where does 'value' come from? The instruction data struct??
  BufferLayout.ns64("value").encode(amount, data);

  let instruction = new TransactionInstruction({
    // Q: How do we know which accounts are signers or writable?
    // A: The sender MUST sign the tx.
    // A: The recipient doesn't sign, but they are writable, since
    // we'll be writing new values to that account.
    // A: SystemProgram isn't either but is needed since the actual
    // transfer of SOL IS the SystemProgram using system_instruction::transfer()!
    // A: SystemProgram => solana_program::system_instruction::transfer()
    keys: [
      { pubkey: from.publicKey, isSigner: true, isWritable: false }, // sender
      { pubkey: to, isSigner: false, isWritable: true }, // reciever
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: programId, // The program we wish to use (i.e, ours!)
    data: data, // Serialized instruction data (i.e., number of lamports)
  });

  // Now that we have instruction, time to send transaction to program
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [from] // Signers i.e., Keypair of the wallet
  );
}

// FIXME Need to use a try/catch here in case no response
// async function showWalletBalanceInSol(publicKey: PublicKey) {
//   connection = new Connection(SOLANA_NETWORK, "confirmed");
//   const response = await connection.getAccountInfo(publicKey);
//   // console.log(response);
//   if (response.lamports) {
//     const balance = response?.lamports / LAMPORTS_PER_SOL;
//     return balance;
//   } else {
//     console.log("Unable to retrieve wallet balance!");
//     return 0;
//   }
// }

/*
 * 2. Simulate transferring SOL between accounts
 */

async function main() {
  // 1. Connect to cluster
  connection = new Connection(SOLANA_NETWORK, "confirmed");
  // 2. Grab target program keypair when want to interact with
  programKeypair = createKeypairFromFile(
    path.join(
      path.resolve(__dirname, `../programs/${PROGRAM_NAME}/target/deploy`),
      `${PROGRAM_NAME}-keypair.json`
    )
  );
  programId = programKeypair.publicKey;
  // Q: Grab local keypair (acts as wallet) for Client?
  // Q: Retrieve accounts we want to modify??
  // 3. Grab the keypairs for the accounts we wish to use for transfers
  // NOTE I believe we don't grab our local keypair this time since we're using
  // these other keypairs to initiate the transactions. We have the keypairs to sign
  // the transaction, so that should be why we don't get my local keypair
  user1Keypair = createKeypairFromFile(__dirname + "/../accounts/user1.json");
  user2Keypair = createKeypairFromFile(__dirname + "/../accounts/user2.json");
  user3Keypair = createKeypairFromFile(__dirname + "/../accounts/user3.json");
  user4Keypair = createKeypairFromFile(__dirname + "/../accounts/user4.json");

  // NOTE: FOR TESTING ONLY: Ensure these accounts have SOL in them
  await connection.confirmTransaction(
    await connection.requestAirdrop(user1Keypair.publicKey, LAMPORTS_PER_SOL)
  );
  await connection.confirmTransaction(
    await connection.requestAirdrop(user2Keypair.publicKey, LAMPORTS_PER_SOL)
  );
  await connection.confirmTransaction(
    await connection.requestAirdrop(user3Keypair.publicKey, LAMPORTS_PER_SOL)
  );
  await connection.confirmTransaction(
    await connection.requestAirdrop(user4Keypair.publicKey, LAMPORTS_PER_SOL)
  );

  // 5. Transact with program using our helper sendLamports() to simulate transfer
  console.log(`user1 sends some SOL to user2...`);
  console.log(`   user1 public key: ${user1Keypair.publicKey}`);
  console.log(`   user2 public key: ${user2Keypair.publicKey}`);
  await sendLamports(user1Keypair, user2Keypair.publicKey, 50000000);
  // Q: How to check the balance for these accounts?
  // A: Send helper showWalletBalanceInSol()
  // user1Balance = await showWalletBalanceInSol(user1Keypair.publicKey);
  // user2Balance = await showWalletBalanceInSol(user2Keypair.publicKey);
  // console.log(`user1 updated balance: ${user1Balance}`);
  // console.log(`user2 updated balance: ${user2Balance}`);

  console.log(`user3 sends some SOL to user4...`);
  console.log(`   user3 public key: ${user3Keypair.publicKey}`);
  console.log(`   user4 public key: ${user4Keypair.publicKey}`);
  await sendLamports(user3Keypair, user4Keypair.publicKey, 40000000);
  // user3Balance = await showWalletBalanceInSol(user3Keypair.publicKey);
  // user4Balance = await showWalletBalanceInSol(user4Keypair.publicKey);
  // console.log(`user3 updated balance: ${user3Balance}`);
  // console.log(`user4 updated balance: ${user4Balance}`);

  console.log(`user4 sends some SOL to user1...`);
  console.log(`   user4 public key: ${user4Keypair.publicKey}`);
  console.log(`   user1 public key: ${user1Keypair.publicKey}`);
  await sendLamports(user4Keypair, user1Keypair.publicKey, 20000000);
  // user4Balance = await showWalletBalanceInSol(user4Keypair.publicKey);
  // user1Balance = await showWalletBalanceInSol(user1Keypair.publicKey);
  // console.log(`user4 updated balance: ${user4Balance}`);
  // console.log(`user1 updated balance: ${user1Balance}`);
}

/*
 * 3. Invoke our main() simulation
 */
main().then(
  () => process.exit(),
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);

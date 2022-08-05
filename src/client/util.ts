import { Keypair, PublicKey } from "@solana/web3.js";
import fs from "mz/fs";
import * as BufferLayout from "@solana/buffer-layout";
import { Buffer } from "buffer";

export async function createKeypairFromFile(
  filepath: string
): Promise<Keypair> {
  console.log("Creating Web3 Keypair from JSON file using filepath: ");
  console.log(`   ${filepath}`);
  // Takes a filepath to a JSON keypair and convert into Keypair object
  const secretKeyString = await fs.readFile(filepath, { encoding: "utf8" });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKey);
}

// Alternate syntax:
// export function createKeypairFromFile(filepath: string): Keypair {
//   return Keypair.fromSecretKey(
//     Buffer.from(JSON.parse(fs.readFileSync(filepath, "utf-8")))
//   );
// }

export async function getStringForInstruction(
  operation: number,
  operation_value: number
) {
  if (operation == 0) {
    return "reset the example";
  } else if (operation == 1) {
    return `add: ${operation_value}`;
  } else if (operation == 2) {
    return `subtract: ${operation_value}`;
  } else if (operation == 3) {
    return `multiply by: ${operation_value}`;
  }
}

/*
 * Converts Instructions Data Struct into a bytes representation
 * so that Borsh can serialize its contents into BPF format
 */

export async function createCalculatorInstructionsBuffer(
  operation: number,
  operation_value: number
): Promise<Buffer> {
  // Define the layout/schema of the instructions struct
  const bufferLayout: BufferLayout.Structure<any> = BufferLayout.struct([
    BufferLayout.u32("operation"),
    BufferLayout.u32("operation_value"),
  ]);

  // Allocate the size of the buffer based on bufferLayout schema
  const CALCULATOR_INSTRUCTIONS_SIZE = bufferLayout.span;
  const buffer = Buffer.alloc(CALCULATOR_INSTRUCTIONS_SIZE);

  // Writes the data into the buffer
  bufferLayout.encode(
    {
      operation: operation,
      operation_value: operation_value,
    },
    buffer
  );

  return buffer;
}

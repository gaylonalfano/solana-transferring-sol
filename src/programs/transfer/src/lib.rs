use {
    std::convert::TryInto,
    solana_program::{
        account_info::{
            next_account_info, AccountInfo
        },
        entrypoint,
        entrypoint::ProgramResult,
        msg,
        program::invoke,
        program_error::ProgramError,
        pubkey::Pubkey,
        system_instruction,
    },
};

entrypoint!(process_instruction);

pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo], // Defined in our TransactionInstruction!
    instruction_data: &[u8],
) -> ProgramResult {

    // 1. Grab our accounts (per our TransactionInstruction keys/accounts!)
    let accounts_iter = &mut accounts.iter();
    let sender = next_account_info(accounts_iter)?; // payer
    let receiver = next_account_info(accounts_iter)?; // payee

    // Q: Need to check account.owner? 
    // Don't think so since our program isn't creating any client/data accounts...
    // The account must be owned by the program in order to modify its data
    // if account.owner != program_id {
    //     msg!("Account does not have the correct program id!");
    //     return Err(ProgramError::IncorrectProgramId);
    // }

    // 2. Deserialize the amount of Lamports out of bytes to send per instruction_data
    // NOTE This comes from our 'data' Buffer we passed in TransactionInstruction
    // NOTE We don't have to create an Instruction struct to retrieve this.
    // We can simply convert the incoming serialized byte array [u8] into integer
    let amount = instruction_data
        .get(..8) // Gets a slice of 8 bytes of data
        .and_then(|slice| slice.try_into().ok()) // Convert/deserialize slice into integer
        .map(u64::from_le_bytes) // Mapping the integer into type u64
        .ok_or(ProgramError::InvalidInstructionData)?; // Handy error handling function

    msg!("Received request to transfer {:?} lamports from {:?} to {:?}",
        amount, sender.key, receiver.key
    );
    msg!("Processing transfer...");


    // 3. Actually perform the transfer
    // Specifically, we use Metaplex's instruction function to create the
    // instruction we need and pass in the needed accounts
    // invoke(
    //     // Instruction
    //     // NOTE Metaplex creates this account and this account stores
    //     // a lot of the following data on-chain. HOWEVER, the metadata_uri
    //     // (in this example) will point to off-chain metadata.
    //     &token_metadata_instruction::create_metadata_accounts_v3(
    //         TOKEN_METADATA_PROGRAM_ID, // Token Metadata Program we're invoking
    //         ctx.accounts.metadata.key(), // metadata_account
    //         ctx.accounts.mint.key(), // mint_account
    //         ctx.accounts.mint_authority.key(), // Mint authority
    //         ctx.accounts.mint_authority.key(), // Payer
    //         ctx.accounts.mint_authority.key(), // Update authority
    //         metadata_name, // Passed in fn as ix data argument
    //         metadata_symbol, // Passed in fn as ix data argument 
    //         metadata_uri, // Passed in fn as ix data argument. Off-chain Metadata (in this example)
    //         None, // Option<Vec<Creator, Global>>
    //         1, // seller_fee_basis_points, 
    //         true, // update_authority_is_signer, 
    //         false, // is_mutable, 
    //         None, // Option<Collection>
    //         None, // Option<Uses>
    //         None, // Option<CollectionDetails>
    //     ),
    //     // Account Info
    //     &[
    //         ctx.accounts.metadata.to_account_info(),
    //         ctx.accounts.mint.to_account_info(),
    //         ctx.accounts.token_account.to_account_info(),
    //         ctx.accounts.mint_authority.to_account_info(),
    //         ctx.accounts.rent.to_account_info(),
    //     ]
    // )?;



    invoke(
        // Instruction
        // NOTE See how easy this instruction is since it's a System Instruction!
        &system_instruction::transfer(sender.key, receiver.key, amount),
        // Accounts Info
        &[sender.clone(), receiver.clone()],
    )?;

    msg!("Transfer completed successfully.");
    Ok(())
}


#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }
}

import { Connection, PublicKey } from '@solana/web3.js'

// Basic Solana mainnet RPC for transactions (batch requests not needed for paid plan)
const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=8b1f5488-b7ad-46c7-ae91-f42dd14a8f46', 'confirmed')

export interface Transaction {
  signature: string
  timestamp: number
  type: 'send' | 'receive' | 'swap' | 'unknown'
  amount?: number
  tokenSymbol?: string
  tokenMint?: string
  from?: string
  to?: string
  status: 'success' | 'failed'
  fee?: number
}

/**
 * Fetches the top 5 recent transactions for a given wallet address
 */
export async function getTopTransactions(walletAddress: string): Promise<Transaction[]> {
  try {
    const publicKey = new PublicKey(walletAddress)

    // Fetch recent signatures
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 5 })

    console.log('Fetched signatures:', signatures.length)

    if (signatures.length === 0) {
      console.log('No signatures found for wallet:', walletAddress)
      return []
    }

    // Fetch full transaction details one by one to avoid batch request issues
    const transactions = []
    for (const sig of signatures) {
      try {
        const tx = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        })
        transactions.push(tx)
      } catch (err) {
        console.error('Error fetching transaction:', sig.signature, err)
        transactions.push(null)
      }
    }

    // Parse transactions
    const parsedTransactions: Transaction[] = []

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i]
      const sigInfo = signatures[i]

      if (!tx) continue

      const transaction: Transaction = {
        signature: sigInfo.signature,
        timestamp: sigInfo.blockTime || Date.now() / 1000,
        type: 'unknown',
        status: tx.meta?.err ? 'failed' : 'success',
        fee: tx.meta?.fee ? tx.meta.fee / 1e9 : undefined
      }

      // Check for swap transactions first (Jupiter, Raydium, etc.)
      const accountKeys = tx.transaction.message.accountKeys.map(key => key.pubkey.toString())
      const jupiterProgram = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'
      const raydiumProgram = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'
      const orcaProgram = 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'

      const isSwap = accountKeys.some(key =>
        key === jupiterProgram ||
        key === raydiumProgram ||
        key === orcaProgram
      )

      if (isSwap) {
        transaction.type = 'swap'
        transaction.tokenSymbol = 'Token'
      }

      // Parse balance changes to determine transaction type and details
      const preBalances = tx.meta?.preBalances || []
      const postBalances = tx.meta?.postBalances || []
      const accountKeys2 = tx.transaction.message.accountKeys

      // Find the wallet's index in the account keys
      const walletIndex = accountKeys2.findIndex(key => key.pubkey.toString() === walletAddress)

      if (walletIndex !== -1 && !isSwap) {
        const preBalance = preBalances[walletIndex] || 0
        const postBalance = postBalances[walletIndex] || 0
        const balanceChange = (postBalance - preBalance) / 1e9

        if (balanceChange > 0) {
          transaction.type = 'receive'
          transaction.amount = Math.abs(balanceChange)
          transaction.tokenSymbol = 'SOL'
        } else if (balanceChange < 0) {
          transaction.type = 'send'
          transaction.amount = Math.abs(balanceChange) - (tx.meta?.fee || 0) / 1e9
          transaction.tokenSymbol = 'SOL'
        }
      }

      // Check parsed instructions for SPL token transfers
      for (const instruction of tx.transaction.message.instructions) {
        if ('parsed' in instruction) {
          const parsed = instruction.parsed
          const info = parsed.info

          // Handle SPL token transfer
          if (parsed.type === 'transfer' && info) {
            // SPL Token transfer
            if (info.mint) {
              transaction.tokenMint = info.mint
              transaction.amount = info.tokenAmount?.uiAmount || parseFloat(info.amount || '0') / Math.pow(10, info.decimals || 9)

              // Get source and destination token accounts
              const source = info.source
              const destination = info.destination
              const authority = info.authority

              // Check if we own the destination (receiving)
              const postTokenBalances = tx.meta?.postTokenBalances || []
              const isReceiving = postTokenBalances.some(tb =>
                tb.owner === walletAddress && tb.mint === info.mint
              )

              if (authority === walletAddress || source === walletAddress) {
                transaction.type = 'send'
              } else if (isReceiving || destination === walletAddress) {
                transaction.type = 'receive'
              }
            }
            // SOL transfer (system program)
            else if (info.lamports) {
              transaction.amount = info.lamports / 1e9
              transaction.tokenSymbol = 'SOL'

              if (info.source === walletAddress) {
                transaction.type = 'send'
              } else if (info.destination === walletAddress) {
                transaction.type = 'receive'
              }
            }
          }

          // Handle SPL token transferChecked
          if (parsed.type === 'transferChecked' && info) {
            transaction.tokenMint = info.mint
            transaction.amount = parseFloat(info.tokenAmount?.uiAmount || '0')

            const authority = info.authority

            // Check post token balances to see if we received
            const postTokenBalances = tx.meta?.postTokenBalances || []
            const isReceiving = postTokenBalances.some(tb =>
              tb.owner === walletAddress && tb.mint === info.mint
            )

            if (authority === walletAddress) {
              transaction.type = 'send'
            } else if (isReceiving) {
              transaction.type = 'receive'
            }
          }
        }
      }

      console.log('Parsed transaction:', {
        signature: transaction.signature,
        type: transaction.type,
        amount: transaction.amount,
        tokenSymbol: transaction.tokenSymbol
      })

      parsedTransactions.push(transaction)
    }

    console.log('Total parsed transactions:', parsedTransactions.length)
    return parsedTransactions
  } catch (error) {
    console.error('Error fetching transactions:', error)
    throw error
  }
}

/**
 * Builds a transaction to send tokens from the wallet to a recipient
 * Returns the serialized transaction as Uint8Array for Privy to sign
 */
export async function buildSendTransaction(params: {
  fromWalletAddress: string
  recipientAddress: string
  tokenMint: string
  amount: number
  decimals: number
}): Promise<{ transaction: Uint8Array; success: boolean; error?: string }> {
  try {
    const { fromWalletAddress, recipientAddress, tokenMint, amount, decimals } = params

    // Validate recipient address
    let recipientPublicKey: PublicKey
    try {
      recipientPublicKey = new PublicKey(recipientAddress)
    } catch {
      return { transaction: new Uint8Array(), success: false, error: 'Invalid recipient address' }
    }

    // Check if sending SOL or SPL token
    const SOL_MINT = 'So11111111111111111111111111111111111111112'

    if (tokenMint === SOL_MINT) {
      // Build SOL transfer transaction
      const { SystemProgram, Transaction, LAMPORTS_PER_SOL } = await import('@solana/web3.js')

      const senderPublicKey = new PublicKey(fromWalletAddress)
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL)

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderPublicKey,
          toPubkey: recipientPublicKey,
          lamports
        })
      )

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = senderPublicKey

      // Serialize transaction to Uint8Array
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      })

      return { transaction: serializedTransaction, success: true }
    } else {
      // Build SPL Token transfer transaction
      const {
        getAssociatedTokenAddress,
        createTransferInstruction,
        createAssociatedTokenAccountInstruction,
        getAccount
      } = await import('@solana/spl-token')
      const { Transaction } = await import('@solana/web3.js')

      const senderPublicKey = new PublicKey(fromWalletAddress)
      const mintPublicKey = new PublicKey(tokenMint)

      // Get sender's token account
      const senderTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        senderPublicKey
      )

      // Get or create recipient's token account
      const recipientTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        recipientPublicKey
      )

      const transaction = new Transaction()

      // Check if recipient token account exists
      try {
        await getAccount(connection, recipientTokenAccount)
      } catch {
        // Create associated token account if it doesn't exist
        transaction.add(
          createAssociatedTokenAccountInstruction(
            senderPublicKey,
            recipientTokenAccount,
            recipientPublicKey,
            mintPublicKey
          )
        )
      }

      // Add transfer instruction
      const transferAmount = Math.floor(amount * Math.pow(10, decimals))
      transaction.add(
        createTransferInstruction(
          senderTokenAccount,
          recipientTokenAccount,
          senderPublicKey,
          transferAmount
        )
      )

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = senderPublicKey

      // Serialize transaction to Uint8Array
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      })

      return { transaction: serializedTransaction, success: true }
    }
  } catch (error: any) {
    console.error('Error building transaction:', error)
    return {
      transaction: new Uint8Array(),
      success: false,
      error: error.message || 'Failed to build transaction'
    }
  }
}

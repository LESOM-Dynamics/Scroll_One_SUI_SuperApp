import { formatEther, parseEther, TransactionResponse } from 'ethers';
import { type Transaction } from '@/store/walletStore';
import { scrollProvider } from './provider';
import { sendTransaction as sendWalletTransaction } from './wallet';

// Scroll blockchain explorer API (using ScrollScan)
const SCROLLSCAN_API = 'https://api.scrollscan.com/api';
const SCROLLSCAN_TESTNET_API = 'https://api-sepolia.scrollscan.com/api';

export async function fetchTransactions(address: string): Promise<Transaction[]> {
  console.log('[TransactionService] Fetching transactions for', address);
  
  try {
    // Try to fetch from ScrollScan API
    const apiUrl = scrollProvider.getConfig().chainId === 534351 
      ? SCROLLSCAN_TESTNET_API 
      : SCROLLSCAN_API;
    
    const response = await fetch(
      `${apiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=YourApiKeyToken`
    );
    
    const data = await response.json();
    
    if (data.status === '1' && data.result) {
      const transactions: Transaction[] = data.result
        .slice(0, 20) // Limit to 20 most recent
        .map((tx: any) => {
          const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
          const value = formatEther(tx.value || '0');
          const fee = formatEther((BigInt(tx.gasUsed || '0') * BigInt(tx.gasPrice || '0')).toString());
          
          return {
            id: tx.hash,
            type: isOutgoing ? 'send' : 'receive',
            amount: value,
            symbol: 'ETH',
            to: tx.to,
            from: tx.from,
            timestamp: parseInt(tx.timeStamp) * 1000,
            status: tx.txreceipt_status === '1' ? 'confirmed' : 'failed',
            hash: tx.hash,
            fee: fee,
          };
        });
      
      console.log(`[TransactionService] Found ${transactions.length} transactions`);
      return transactions;
    }
    
    // Fallback: return empty array if API fails
    console.log('[TransactionService] No transactions found or API error');
    return [];
  } catch (error) {
    console.error('[TransactionService] Error fetching transactions:', error);
    // Return empty array on error
    return [];
  }
}

export async function sendTransaction(
  to: string,
  amount: string,
  symbol: string = 'ETH'
): Promise<Transaction> {
  console.log('[TransactionService] Sending transaction:', { to, amount, symbol });
  
  try {
    const provider = scrollProvider.getProvider();
    const value = parseEther(amount);
    
    // Estimate gas first
    const gasEstimate = await scrollProvider.estimateGas({
      to,
      value,
    });
    
    // Get current gas price
    const gasPrice = await scrollProvider.getGasPrice();
    
    // Create transaction request
    const transactionRequest = {
      to,
      value,
      gasLimit: gasEstimate,
      gasPrice: gasPrice,
    };
    
    // Send the transaction
    const txResponse = await sendWalletTransaction(transactionRequest, provider);
    
    const fee = formatEther((gasEstimate * gasPrice).toString());
    
    const transaction: Transaction = {
      id: txResponse.hash,
      type: 'send',
      amount,
      symbol,
      to,
      timestamp: Date.now(),
      status: 'pending',
      hash: txResponse.hash,
      fee: fee,
    };
    
    console.log('[TransactionService] Transaction sent:', txResponse.hash);
    
    // Wait for confirmation in background (don't block)
    scrollProvider.waitForTransaction(txResponse.hash, 1)
      .then((receipt) => {
        console.log('[TransactionService] Transaction confirmed:', receipt?.hash);
      })
      .catch((error) => {
        console.error('[TransactionService] Transaction failed:', error);
      });
    
    return transaction;
  } catch (error) {
    console.error('[TransactionService] Error sending transaction:', error);
    throw error;
  }
}

export async function estimateTransactionFee(
  to: string,
  amount: string
): Promise<string> {
  console.log('[TransactionService] Estimating fee for:', { to, amount });
  
  try {
    const value = parseEther(amount);
    const gasEstimate = await scrollProvider.estimateGas({
      to,
      value,
    });
    
    const gasPrice = await scrollProvider.getGasPrice();
    const totalFee = gasEstimate * gasPrice;
    const feeEth = formatEther(totalFee.toString());
    
    console.log('[TransactionService] Estimated fee:', feeEth);
    return feeEth;
  } catch (error) {
    console.error('[TransactionService] Error estimating fee:', error);
    // Return a default fee estimate
    return '0.002';
  }
}

export async function getTransactionStatus(hash: string): Promise<'pending' | 'confirmed' | 'failed'> {
  try {
    const receipt = await scrollProvider.getTransactionReceipt(hash);
    if (!receipt) {
      return 'pending';
    }
    return receipt.status === 1 ? 'confirmed' : 'failed';
  } catch (error) {
    console.error('[TransactionService] Error getting transaction status:', error);
    return 'pending';
  }
}

export function getTransactionExplorerUrl(hash: string, testnet: boolean = false): string {
  const baseUrl = testnet ? 'https://sepolia.scrollscan.com' : 'https://scrollscan.com';
  return `${baseUrl}/tx/${hash}`;
}

export function formatTransactionTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

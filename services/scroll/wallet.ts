import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Wallet as EthersWallet, JsonRpcProvider, TransactionRequest, TransactionResponse, isHexString } from 'ethers';

const WALLET_KEY = 'scroll_wallet_address';
const PRIVATE_KEY = 'scroll_private_key';

export interface Wallet {
  address: string;
}

let cachedWallet: EthersWallet | null = null;

function isValidPrivateKey(key: string): boolean {
  // Check if it's a valid hex string starting with 0x and has correct length (66 chars for 32 bytes + 0x)
  return isHexString(key) && key.length === 66 && key.startsWith('0x');
}

async function getWalletInstance(): Promise<EthersWallet | null> {
  if (cachedWallet) {
    return cachedWallet;
  }

  try {
    const privateKey = await SecureStore.getItemAsync(PRIVATE_KEY);
    if (!privateKey || !isValidPrivateKey(privateKey)) {
      return null;
    }

    cachedWallet = new EthersWallet(privateKey);
    return cachedWallet;
  } catch (error) {
    console.error('[WalletService] Error getting wallet instance:', error);
    return null;
  }
}

export async function getPrivateKey(): Promise<string | null> {
  try {
    const privateKey = await SecureStore.getItemAsync(PRIVATE_KEY);
    if (!privateKey || !isValidPrivateKey(privateKey)) {
      return null;
    }
    return privateKey;
  } catch (error) {
    console.error('[WalletService] Error getting private key:', error);
    return null;
  }
}

export async function createWallet(): Promise<Wallet> {
  console.log('[WalletService] Creating new wallet');
  
  try {
    // Generate 32 random bytes using expo-crypto (works in React Native)
    const randomBytes = Crypto.getRandomBytes(32);
    
    // Convert bytes to hex string and prepend 0x
    const privateKey = '0x' + Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Create wallet from private key
    const wallet = new EthersWallet(privateKey);
    const address = await wallet.getAddress();
    
    // Store the address and private key securely
    await SecureStore.setItemAsync(WALLET_KEY, address);
    await SecureStore.setItemAsync(PRIVATE_KEY, privateKey);
    
    // Cache the wallet instance
    cachedWallet = wallet;
    
    console.log('[WalletService] Wallet created:', address);
    
    return {
      address,
    };
  } catch (error) {
    console.error('[WalletService] Error creating wallet:', error);
    throw new Error('Failed to create wallet');
  }
}

export async function loadWallet(): Promise<Wallet | null> {
  console.log('[WalletService] Loading existing wallet');
  
  try {
    const address = await SecureStore.getItemAsync(WALLET_KEY);
    const privateKey = await SecureStore.getItemAsync(PRIVATE_KEY);
    
    if (!address || !privateKey) {
      console.log('[WalletService] No wallet found');
      return null;
    }
    
    // Validate private key - if it's invalid (like old mock key), delete it
    if (!isValidPrivateKey(privateKey)) {
      console.log('[WalletService] Invalid private key found, deleting old wallet data');
      await SecureStore.deleteItemAsync(WALLET_KEY);
      await SecureStore.deleteItemAsync(PRIVATE_KEY);
      return null;
    }
    
    // Create wallet instance from private key
    const wallet = new EthersWallet(privateKey);
    cachedWallet = wallet;
    
    // Verify the address matches
    const walletAddress = await wallet.getAddress();
    if (walletAddress.toLowerCase() !== address.toLowerCase()) {
      console.log('[WalletService] Address mismatch, deleting wallet data');
      await SecureStore.deleteItemAsync(WALLET_KEY);
      await SecureStore.deleteItemAsync(PRIVATE_KEY);
      cachedWallet = null;
      return null;
    }
    
    console.log('[WalletService] Wallet loaded:', address);
    
    return {
      address,
    };
  } catch (error) {
    console.error('[WalletService] Error loading wallet:', error);
    // If there's an error, try to clean up invalid data
    try {
      await SecureStore.deleteItemAsync(WALLET_KEY);
      await SecureStore.deleteItemAsync(PRIVATE_KEY);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    cachedWallet = null;
    return null;
  }
}

export async function deleteWallet(): Promise<void> {
  console.log('[WalletService] Deleting wallet');
  
  await SecureStore.deleteItemAsync(WALLET_KEY);
  await SecureStore.deleteItemAsync(PRIVATE_KEY);
  cachedWallet = null;
  
  console.log('[WalletService] Wallet deleted');
}

export async function resetWallet(): Promise<Wallet> {
  console.log('[WalletService] Resetting wallet');

  await deleteWallet();
  const wallet = await createWallet();

  console.log('[WalletService] Wallet reset complete:', wallet.address);
  return wallet;
}

export async function signTransaction(transaction: TransactionRequest, provider?: JsonRpcProvider): Promise<string> {
  console.log('[WalletService] Signing transaction');
  
  try {
    const wallet = await getWalletInstance();
    if (!wallet) {
      throw new Error('No wallet available');
    }

    // If provider is provided, connect wallet to it
    const signer = provider ? wallet.connect(provider) : wallet;
    
    // Sign the transaction
    const signedTx = await signer.signTransaction(transaction);
    
    console.log('[WalletService] Transaction signed');
    return signedTx;
  } catch (error) {
    console.error('[WalletService] Error signing transaction:', error);
    throw error;
  }
}

export async function signMessage(message: string): Promise<string> {
  console.log('[WalletService] Signing message:', message);
  
  try {
    const wallet = await getWalletInstance();
    if (!wallet) {
      throw new Error('No wallet available');
    }

    // Sign the message
    const signature = await wallet.signMessage(message);
    
    console.log('[WalletService] Message signed');
    return signature;
  } catch (error) {
    console.error('[WalletService] Error signing message:', error);
    throw error;
  }
}

export async function sendTransaction(
  transaction: TransactionRequest,
  provider: JsonRpcProvider
): Promise<TransactionResponse> {
  console.log('[WalletService] Sending transaction');
  
  try {
    const wallet = await getWalletInstance();
    if (!wallet) {
      throw new Error('No wallet available');
    }

    const signer = wallet.connect(provider);
    const txResponse = await signer.sendTransaction(transaction);
    
    console.log('[WalletService] Transaction sent:', txResponse.hash);
    return txResponse;
  } catch (error) {
    console.error('[WalletService] Error sending transaction:', error);
    throw error;
  }
}

export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

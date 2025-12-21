import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Wallet as EthersWallet, JsonRpcProvider, TransactionRequest, TransactionResponse, isHexString } from 'ethers';

const WALLET_KEY = 'scroll_wallet_address';
const PRIVATE_KEY = 'scroll_private_key';
const WALLETS_LIST_KEY = 'scroll_wallets_list';
const CURRENT_WALLET_KEY = 'scroll_current_wallet_id';

export interface Wallet {
  address: string;
  id: string; // Unique identifier for the wallet
  name?: string; // Optional name for the wallet
  createdAt: number; // Timestamp when wallet was created
}

let cachedWallet: EthersWallet | null = null;

function isValidPrivateKey(key: string): boolean {
  // Check if it's a valid hex string starting with 0x and has correct length (66 chars for 32 bytes + 0x)
  return isHexString(key) && key.length === 66 && key.startsWith('0x');
}

// New function to get all wallets
export async function getAllWallets(): Promise<Wallet[]> {
  try {
    const walletsJson = await SecureStore.getItemAsync(WALLETS_LIST_KEY);
    if (!walletsJson) {
      return [];
    }
    return JSON.parse(walletsJson);
  } catch (error) {
    console.error('[WalletService] Error getting wallets list:', error);
    return [];
  }
}

// New function to save wallets list
async function saveWalletsList(wallets: Wallet[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(WALLETS_LIST_KEY, JSON.stringify(wallets));
  } catch (error) {
    console.error('[WalletService] Error saving wallets list:', error);
  }
}

// New function to get current wallet ID
export async function getCurrentWalletId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(CURRENT_WALLET_KEY);
  } catch (error) {
    console.error('[WalletService] Error getting current wallet ID:', error);
    return null;
  }
}

// New function to set current wallet
export async function setCurrentWallet(walletId: string): Promise<void> {
  try {
    const wallets = await getAllWallets();
    const wallet = wallets.find(w => w.id === walletId);
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Get the private key for this wallet
    const privateKeyKey = `${PRIVATE_KEY}_${walletId}`;
    const privateKey = await SecureStore.getItemAsync(privateKeyKey);
    
    if (!privateKey || !isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key for wallet');
    }

    // Set as current wallet
    await SecureStore.setItemAsync(CURRENT_WALLET_KEY, walletId);
    await SecureStore.setItemAsync(WALLET_KEY, wallet.address);
    await SecureStore.setItemAsync(PRIVATE_KEY, privateKey);
    
    // Update cache
    cachedWallet = new EthersWallet(privateKey);
    
    console.log('[WalletService] Current wallet set to:', wallet.address);
  } catch (error) {
    console.error('[WalletService] Error setting current wallet:', error);
    throw error;
  }
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

export async function createWallet(name?: string): Promise<Wallet> {
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
    
    // Generate unique ID for this wallet
    const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store private key with wallet ID
    const privateKeyKey = `${PRIVATE_KEY}_${walletId}`;
    await SecureStore.setItemAsync(privateKeyKey, privateKey);
    
    // Create wallet object
    const walletData: Wallet = {
      address,
      id: walletId,
      name: name || `Wallet ${address.substring(0, 6)}`,
      createdAt: Date.now(),
    };
    
    // Add to wallets list
    const wallets = await getAllWallets();
    wallets.push(walletData);
    await saveWalletsList(wallets);
    
    // Set as current wallet
    await setCurrentWallet(walletId);
    
    console.log('[WalletService] Wallet created:', address);
    
    return walletData;
  } catch (error) {
    console.error('[WalletService] Error creating wallet:', error);
    throw new Error('Failed to create wallet');
  }
}

export async function loadWallet(): Promise<Wallet | null> {
  console.log('[WalletService] Loading existing wallet');
  
  try {
    const currentWalletId = await getCurrentWalletId();
    
    if (!currentWalletId) {
      // Fallback to old single wallet format for backward compatibility
      const address = await SecureStore.getItemAsync(WALLET_KEY);
      const privateKey = await SecureStore.getItemAsync(PRIVATE_KEY);
      
      if (!address || !privateKey) {
        console.log('[WalletService] No wallet found');
        return null;
      }
      
      if (!isValidPrivateKey(privateKey)) {
        return null;
      }
      
      const wallet = new EthersWallet(privateKey);
      cachedWallet = wallet;
      
      return {
        address,
        id: 'legacy_wallet',
        createdAt: Date.now(),
      };
    }
    
    // Load wallet by ID
    const wallets = await getAllWallets();
    const wallet = wallets.find(w => w.id === currentWalletId);
    
    if (!wallet) {
      console.log('[WalletService] Current wallet not found in list');
      return null;
    }
    
    const privateKeyKey = `${PRIVATE_KEY}_${currentWalletId}`;
    const privateKey = await SecureStore.getItemAsync(privateKeyKey);
    
    if (!privateKey || !isValidPrivateKey(privateKey)) {
      console.log('[WalletService] Invalid private key for current wallet');
      return null;
    }
    
    const walletInstance = new EthersWallet(privateKey);
    cachedWallet = walletInstance;
    
    const walletAddress = await walletInstance.getAddress();
    if (walletAddress.toLowerCase() !== wallet.address.toLowerCase()) {
      console.log('[WalletService] Address mismatch');
      return null;
    }
    
    console.log('[WalletService] Wallet loaded:', wallet.address);
    return wallet;
  } catch (error) {
    console.error('[WalletService] Error loading wallet:', error);
    cachedWallet = null;
    return null;
  }
}

// New function to delete a specific wallet
export async function deleteWalletById(walletId: string): Promise<void> {
  try {
    const wallets = await getAllWallets();
    const walletIndex = wallets.findIndex(w => w.id === walletId);
    
    if (walletIndex === -1) {
      throw new Error('Wallet not found');
    }
    
    // Delete private key
    const privateKeyKey = `${PRIVATE_KEY}_${walletId}`;
    await SecureStore.deleteItemAsync(privateKeyKey);
    
    // Remove from list
    wallets.splice(walletIndex, 1);
    await saveWalletsList(wallets);
    
    // If this was the current wallet, set another one or clear
    const currentWalletId = await getCurrentWalletId();
    if (currentWalletId === walletId) {
      if (wallets.length > 0) {
        await setCurrentWallet(wallets[0].id);
      } else {
        await SecureStore.deleteItemAsync(CURRENT_WALLET_KEY);
        await SecureStore.deleteItemAsync(WALLET_KEY);
        await SecureStore.deleteItemAsync(PRIVATE_KEY);
        cachedWallet = null;
      }
    }
    
    console.log('[WalletService] Wallet deleted:', walletId);
  } catch (error) {
    console.error('[WalletService] Error deleting wallet:', error);
    throw error;
  }
}

// Keep old deleteWallet for backward compatibility
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

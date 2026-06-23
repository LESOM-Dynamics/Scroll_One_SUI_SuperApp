import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { isValidSuiAddress, normalizeSuiAddress } from '@mysten/sui/utils';
import { suiProvider } from './provider';

const WALLET_KEY = 'sui_wallet_address';
const PRIVATE_KEY = 'sui_private_key';
const WALLETS_LIST_KEY = 'sui_wallets_list';
const CURRENT_WALLET_KEY = 'sui_current_wallet_id';

export interface Wallet {
  address: string;
  id: string;
  name?: string;
  createdAt: number;
}

let cachedKeypair: Ed25519Keypair | null = null;

function isValidSecretKey(key: string): boolean {
  return key.startsWith('suiprivkey') || /^[A-Za-z0-9+/=]+$/.test(key);
}

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

async function saveWalletsList(wallets: Wallet[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(WALLETS_LIST_KEY, JSON.stringify(wallets));
  } catch (error) {
    console.error('[WalletService] Error saving wallets list:', error);
  }
}

export async function getCurrentWalletId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(CURRENT_WALLET_KEY);
  } catch (error) {
    console.error('[WalletService] Error getting current wallet ID:', error);
    return null;
  }
}

export async function setCurrentWallet(walletId: string): Promise<void> {
  try {
    const wallets = await getAllWallets();
    const wallet = wallets.find((w) => w.id === walletId);

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const privateKeyKey = `${PRIVATE_KEY}_${walletId}`;
    const secretKey = await SecureStore.getItemAsync(privateKeyKey);

    if (!secretKey || !isValidSecretKey(secretKey)) {
      throw new Error('Invalid private key for wallet');
    }

    await SecureStore.setItemAsync(CURRENT_WALLET_KEY, walletId);
    await SecureStore.setItemAsync(WALLET_KEY, wallet.address);
    await SecureStore.setItemAsync(PRIVATE_KEY, secretKey);

    cachedKeypair = Ed25519Keypair.fromSecretKey(secretKey);

    console.log('[WalletService] Current wallet set to:', wallet.address);
  } catch (error) {
    console.error('[WalletService] Error setting current wallet:', error);
    throw error;
  }
}

async function getKeypairInstance(): Promise<Ed25519Keypair | null> {
  if (cachedKeypair) {
    return cachedKeypair;
  }

  try {
    const secretKey = await SecureStore.getItemAsync(PRIVATE_KEY);
    if (!secretKey || !isValidSecretKey(secretKey)) {
      return null;
    }

    cachedKeypair = Ed25519Keypair.fromSecretKey(secretKey);
    return cachedKeypair;
  } catch (error) {
    console.error('[WalletService] Error getting wallet instance:', error);
    return null;
  }
}

export async function getPrivateKey(): Promise<string | null> {
  try {
    const secretKey = await SecureStore.getItemAsync(PRIVATE_KEY);
    if (!secretKey || !isValidSecretKey(secretKey)) {
      return null;
    }
    return secretKey;
  } catch (error) {
    console.error('[WalletService] Error getting private key:', error);
    return null;
  }
}

export async function createWallet(name?: string): Promise<Wallet> {
  console.log('[WalletService] Creating new Sui wallet');

  try {
    const keypair = Ed25519Keypair.generate();
    const secretKey = keypair.getSecretKey();
    const address = keypair.toSuiAddress();

    const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const privateKeyKey = `${PRIVATE_KEY}_${walletId}`;
    await SecureStore.setItemAsync(privateKeyKey, secretKey);

    const walletData: Wallet = {
      address,
      id: walletId,
      name: name || `Wallet ${address.substring(0, 6)}`,
      createdAt: Date.now(),
    };

    const wallets = await getAllWallets();
    wallets.push(walletData);
    await saveWalletsList(wallets);
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
      const address = await SecureStore.getItemAsync(WALLET_KEY);
      const secretKey = await SecureStore.getItemAsync(PRIVATE_KEY);

      if (!address || !secretKey) {
        console.log('[WalletService] No wallet found');
        return null;
      }

      if (!isValidSecretKey(secretKey)) {
        return null;
      }

      const keypair = Ed25519Keypair.fromSecretKey(secretKey);
      cachedKeypair = keypair;

      return {
        address,
        id: 'legacy_wallet',
        createdAt: Date.now(),
      };
    }

    const wallets = await getAllWallets();
    const wallet = wallets.find((w) => w.id === currentWalletId);

    if (!wallet) {
      console.log('[WalletService] Current wallet not found in list');
      return null;
    }

    const privateKeyKey = `${PRIVATE_KEY}_${currentWalletId}`;
    const secretKey = await SecureStore.getItemAsync(privateKeyKey);

    if (!secretKey || !isValidSecretKey(secretKey)) {
      console.log('[WalletService] Invalid private key for current wallet');
      return null;
    }

    const keypair = Ed25519Keypair.fromSecretKey(secretKey);
    cachedKeypair = keypair;

    const walletAddress = keypair.toSuiAddress();
    if (normalizeSuiAddress(walletAddress) !== normalizeSuiAddress(wallet.address)) {
      console.log('[WalletService] Address mismatch');
      return null;
    }

    console.log('[WalletService] Wallet loaded:', wallet.address);
    return wallet;
  } catch (error) {
    console.error('[WalletService] Error loading wallet:', error);
    cachedKeypair = null;
    return null;
  }
}

export async function deleteWalletById(walletId: string): Promise<void> {
  try {
    const wallets = await getAllWallets();
    const walletIndex = wallets.findIndex((w) => w.id === walletId);

    if (walletIndex === -1) {
      throw new Error('Wallet not found');
    }

    const privateKeyKey = `${PRIVATE_KEY}_${walletId}`;
    await SecureStore.deleteItemAsync(privateKeyKey);

    wallets.splice(walletIndex, 1);
    await saveWalletsList(wallets);

    const currentWalletId = await getCurrentWalletId();
    if (currentWalletId === walletId) {
      if (wallets.length > 0) {
        await setCurrentWallet(wallets[0].id);
      } else {
        await SecureStore.deleteItemAsync(CURRENT_WALLET_KEY);
        await SecureStore.deleteItemAsync(WALLET_KEY);
        await SecureStore.deleteItemAsync(PRIVATE_KEY);
        cachedKeypair = null;
      }
    }

    console.log('[WalletService] Wallet deleted:', walletId);
  } catch (error) {
    console.error('[WalletService] Error deleting wallet:', error);
    throw error;
  }
}

export async function deleteWallet(): Promise<void> {
  console.log('[WalletService] Deleting wallet');

  await SecureStore.deleteItemAsync(WALLET_KEY);
  await SecureStore.deleteItemAsync(PRIVATE_KEY);
  cachedKeypair = null;

  console.log('[WalletService] Wallet deleted');
}

export async function resetWallet(): Promise<Wallet> {
  console.log('[WalletService] Resetting wallet');

  await deleteWallet();
  const wallet = await createWallet();

  console.log('[WalletService] Wallet reset complete:', wallet.address);
  return wallet;
}

export async function signMessage(message: string): Promise<string> {
  console.log('[WalletService] Signing message:', message);

  try {
    const keypair = await getKeypairInstance();
    if (!keypair) {
      throw new Error('No wallet available');
    }

    const messageBytes = new TextEncoder().encode(message);
    const { signature } = await keypair.signPersonalMessage(messageBytes);

    console.log('[WalletService] Message signed');
    return signature;
  } catch (error) {
    console.error('[WalletService] Error signing message:', error);
    throw error;
  }
}

export async function sendSuiTransaction(
  to: string,
  amountMist: bigint
): Promise<{ digest: string; from: string; to: string }> {
  console.log('[WalletService] Sending Sui transaction');

  try {
    const keypair = await getKeypairInstance();
    if (!keypair) {
      throw new Error('No wallet available');
    }

    if (!isValidSuiAddress(to)) {
      throw new Error('Invalid recipient address');
    }

    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [amountMist]);
    tx.transferObjects([coin], normalizeSuiAddress(to));

    const client = suiProvider.getClient();
    const result = await keypair.signAndExecuteTransaction({
      transaction: tx,
      client: client.core,
    });

    const digest = result.digest;
    if (!digest) {
      throw new Error('Transaction failed: no digest returned');
    }

    console.log('[WalletService] Transaction sent:', digest);
    return {
      digest,
      from: keypair.toSuiAddress(),
      to: normalizeSuiAddress(to),
    };
  } catch (error) {
    console.error('[WalletService] Error sending transaction:', error);
    throw error;
  }
}

export async function getKeypairOrThrow(): Promise<Ed25519Keypair> {
  const keypair = await getKeypairInstance();
  if (!keypair) {
    throw new Error('Wallet is locked or not available');
  }
  return keypair;
}

export async function signAndExecuteTransaction(tx: Transaction): Promise<{ digest: string }> {
  const keypair = await getKeypairOrThrow();
  const client = suiProvider.getClient();
  const result = await keypair.signAndExecuteTransaction({
    transaction: tx,
    client: client.core,
  });
  if (!result.digest) {
    throw new Error('Transaction failed: no digest returned');
  }
  return { digest: result.digest };
}

export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

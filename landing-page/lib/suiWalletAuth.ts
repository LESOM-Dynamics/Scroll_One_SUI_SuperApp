import { getWallets } from '@mysten/wallet-standard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type SuiWallet = ReturnType<ReturnType<typeof getWallets>['get']>[number];

function findSuiWallet(wallets: SuiWallet[]): SuiWallet | undefined {
  return wallets.find((wallet) =>
    wallet.chains.some((chain) => chain.toLowerCase().includes('sui'))
  );
}

export async function signInWithSuiWallet(): Promise<{
  walletAddress: string;
  message: string;
  signature: string;
  token: string;
}> {
  const wallets = getWallets().get();
  const suiWallet = findSuiWallet(wallets);

  if (!suiWallet) {
    throw new Error('No Sui wallet found. Install the Sui Wallet browser extension.');
  }

  const connectFeature = suiWallet.features['standard:connect'];
  if (!connectFeature) {
    throw new Error('Selected wallet does not support standard connect.');
  }

  const { accounts } = await connectFeature.connect();
  const account = accounts[0];
  if (!account?.address) {
    throw new Error('No Sui account returned from wallet.');
  }

  const walletAddress = account.address;

  const messageRes = await fetch(`${API_BASE_URL}/api/v1/auth/wallet/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  });

  if (!messageRes.ok) {
    throw new Error('Failed to fetch authentication message from backend.');
  }

  const messageJson = await messageRes.json();
  const message = messageJson.data?.message as string | undefined;
  if (!message) {
    throw new Error('Backend did not return an authentication message.');
  }

  const signFeature = suiWallet.features['sui:signPersonalMessage'];
  if (!signFeature) {
    throw new Error('Wallet does not support personal message signing.');
  }

  const { signature } = await signFeature.signPersonalMessage({
    message: new TextEncoder().encode(message),
    account,
  });

  const verifyRes = await fetch(`${API_BASE_URL}/api/v1/auth/wallet/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, message, signature }),
  });

  if (!verifyRes.ok) {
    throw new Error('Wallet authentication failed. Ensure this wallet is a Super Admin.');
  }

  const verifyJson = await verifyRes.json();
  const token = verifyJson.data?.token as string | undefined;
  if (!token) {
    throw new Error('No session token received from backend.');
  }

  return { walletAddress, message, signature, token };
}

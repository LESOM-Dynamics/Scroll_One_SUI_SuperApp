import { create } from 'zustand';

export interface Asset {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  change24h: number;
  icon: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'contract';
  amount: string;
  symbol: string;
  to?: string;
  from?: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  hash: string;
  fee: string;
  network?: string; // e.g., 'Scroll Mainnet', 'Scroll Sepolia', 'Ethereum'
  crossChain?: boolean; // Indicates if this is a cross-chain transaction
  gasUsed?: string; // Gas used in the transaction
}

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isUnlocked: boolean;
  balance: string;
  assets: Asset[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  
  setAddress: (address: string) => void;
  setBalance: (balance: string) => void;
  setAssets: (assets: Asset[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setUnlocked: (isUnlocked: boolean) => void;
  disconnect: () => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  isConnected: false,
  isUnlocked: false,
  balance: '0.00',
  assets: [],
  transactions: [],
  isLoading: false,
  error: null,
  setAddress: (address) => set({ address, isConnected: !!address }),
  
  setBalance: (balance) => set({ balance }),
  
  setAssets: (assets) => set({ assets }),
  
  setTransactions: (transactions) => set({ transactions }),
  
  addTransaction: (transaction) => 
    set((state) => ({ 
      transactions: [transaction, ...state.transactions] 
    })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),

  setUnlocked: (isUnlocked) => set({ isUnlocked }),
  
  disconnect: () => set({ 
    address: null, 
    isConnected: false,
    isUnlocked: false,
    balance: '0.00',
    assets: [],
    transactions: [],
  }),
  
  reset: () => set({
    address: null,
    isConnected: false,
    isUnlocked: false,
    balance: '0.00',
    assets: [],
    transactions: [],
    isLoading: false,
    error: null,
  }),
}));

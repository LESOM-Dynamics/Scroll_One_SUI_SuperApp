import { parseToMist, SUI_TYPE_ARG } from '@mysten/sui/utils';
import { type Transaction } from '@/store/walletStore';
import { suiProvider } from './provider';
import { sendSuiTransaction } from './wallet';
import { notificationService } from '../notifications/notificationService';
import { useWalletStore } from '@/store/walletStore';
import { useSettingsStore } from '@/store/settingsStore';
import { mistToSui } from './tokens';

export async function fetchTransactions(address: string): Promise<Transaction[]> {
  console.log('[TransactionService] Fetching transactions for', address);

  try {
    const client = suiProvider.getClient();
    const config = suiProvider.getConfig();

    const [sent, received] = await Promise.all([
      client.queryTransactionBlocks({
        filter: { FromAddress: address },
        options: { showBalanceChanges: true, showEffects: true },
        order: 'descending',
        limit: 20,
      }),
      client.queryTransactionBlocks({
        filter: { ToAddress: address },
        options: { showBalanceChanges: true, showEffects: true },
        order: 'descending',
        limit: 20,
      }),
    ]);

    const allTxs = [...sent.data, ...received.data];
    const seen = new Set<string>();

    const transactions: Transaction[] = allTxs
      .filter((tx) => {
        if (seen.has(tx.digest)) return false;
        seen.add(tx.digest);
        return true;
      })
      .slice(0, 20)
      .map((tx) => {
        const isOutgoing = tx.transaction?.data.sender === address;
        const suiChange = tx.balanceChanges?.find(
          (change) => change.coinType === SUI_TYPE_ARG && change.owner?.AddressOwner === address
        );
        const amount = suiChange
          ? mistToSui(Math.abs(Number(suiChange.amount)).toString())
          : '0';
        const gasUsed = tx.effects?.gasUsed;
        const feeMist =
          gasUsed != null
            ? BigInt(gasUsed.computationCost) +
              BigInt(gasUsed.storageCost) -
              BigInt(gasUsed.storageRebate)
            : 0n;

        const status =
          tx.effects?.status?.status === 'success'
            ? 'confirmed'
            : tx.effects?.status?.status === 'failure'
              ? 'failed'
              : 'pending';

        return {
          id: tx.digest,
          type: isOutgoing ? 'send' : 'receive',
          amount,
          symbol: 'SUI',
          to: isOutgoing ? undefined : address,
          from: tx.transaction?.data.sender,
          timestamp: Number(tx.timestampMs ?? Date.now()),
          status: status as Transaction['status'],
          hash: tx.digest,
          fee: mistToSui(feeMist.toString()),
          network: config.chainName,
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);

    console.log(`[TransactionService] Found ${transactions.length} transactions`);
    return transactions;
  } catch (error) {
    console.error('[TransactionService] Error fetching transactions:', error);
    return [];
  }
}

export async function sendTransaction(
  to: string,
  amount: string,
  symbol: string = 'SUI'
): Promise<Transaction> {
  console.log('[TransactionService] Sending transaction:', { to, amount, symbol });

  if (symbol.toUpperCase() !== 'SUI') {
    throw new Error('Only native SUI transfers are supported currently');
  }

  try {
    const amountMist = parseToMist(amount);
    const estimate = await suiProvider.estimateTransactionFee(
      (tx) => {
        const [coin] = tx.splitCoins(tx.gas, [amountMist]);
        tx.transferObjects([coin], to);
      },
      useWalletStore.getState().address ?? to
    );

    const txResult = await sendSuiTransaction(to, amountMist);

    const transaction: Transaction = {
      id: txResult.digest,
      type: 'send',
      amount,
      symbol,
      to,
      timestamp: Date.now(),
      status: 'pending',
      hash: txResult.digest,
      fee: estimate.fee,
      network: suiProvider.getConfig().chainName,
    };

    console.log('[TransactionService] Transaction sent:', txResult.digest);

    suiProvider
      .waitForTransaction(txResult.digest)
      .then(async () => {
        console.log('[TransactionService] Transaction confirmed:', txResult.digest);

        const { transactions, setTransactions } = useWalletStore.getState();
        const updatedTransactions = transactions.map((tx) =>
          tx.id === txResult.digest ? { ...tx, status: 'confirmed' as const } : tx
        );
        setTransactions(updatedTransactions);

        const confirmedTx = updatedTransactions.find((tx) => tx.id === txResult.digest);
        if (confirmedTx) {
          const { notificationsEnabled } = useSettingsStore.getState();
          if (notificationsEnabled) {
            await notificationService.notifyTransactionConfirmed(confirmedTx);
          }
        }
      })
      .catch(async (error) => {
        console.error('[TransactionService] Transaction failed:', error);

        const { transactions, setTransactions } = useWalletStore.getState();
        const updatedTransactions = transactions.map((tx) =>
          tx.id === txResult.digest ? { ...tx, status: 'failed' as const } : tx
        );
        setTransactions(updatedTransactions);

        const failedTx = updatedTransactions.find((tx) => tx.id === txResult.digest);
        if (failedTx) {
          const { notificationsEnabled } = useSettingsStore.getState();
          if (notificationsEnabled) {
            await notificationService.notifyTransactionFailed(failedTx);
          }
        }
      });

    return transaction;
  } catch (error) {
    console.error('[TransactionService] Error sending transaction:', error);
    throw error;
  }
}

export async function estimateTransactionFee(to: string, amount: string): Promise<string> {
  console.log('[TransactionService] Estimating fee for:', { to, amount });

  try {
    const amountMist = parseToMist(amount);
    const sender = useWalletStore.getState().address ?? to;
    const estimate = await suiProvider.estimateTransactionFee((tx) => {
      const [coin] = tx.splitCoins(tx.gas, [amountMist]);
      tx.transferObjects([coin], to);
    }, sender);

    console.log('[TransactionService] Estimated fee:', estimate.fee);
    return estimate.fee;
  } catch (error) {
    console.error('[TransactionService] Error estimating fee:', error);
    return '0.005';
  }
}

export async function getTransactionStatus(
  digest: string
): Promise<'pending' | 'confirmed' | 'failed'> {
  try {
    const tx = await suiProvider.getTransaction(digest);
    if (!tx) {
      return 'pending';
    }
    if (tx.effects?.status?.status === 'success') {
      return 'confirmed';
    }
    if (tx.effects?.status?.status === 'failure') {
      return 'failed';
    }
    return 'pending';
  } catch (error) {
    console.error('[TransactionService] Error getting transaction status:', error);
    return 'pending';
  }
}

export function getTransactionExplorerUrl(digest: string, testnet: boolean = false): string {
  const baseUrl = testnet
    ? 'https://suiscan.xyz/testnet/tx/'
    : 'https://suiscan.xyz/mainnet/tx/';
  return `${baseUrl}${digest}`;
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

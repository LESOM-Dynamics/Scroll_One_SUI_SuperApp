import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { deepbook } from '@mysten/deepbook-v3';
import { suiProvider } from './provider';

export function createDeepBookClient(address: string) {
  const config = suiProvider.getConfig();
  return new SuiJsonRpcClient({ url: config.rpcUrl, network: config.network }).$extend(
    deepbook({ address })
  );
}

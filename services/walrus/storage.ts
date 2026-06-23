import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { walrus, WalrusFile } from '@mysten/walrus';
import { getWalrusEndpoints, WALRUS_DEFAULT_EPOCHS } from './config';
import { suiProvider } from '../sui/provider';
import { getKeypairOrThrow } from '../sui/wallet';

export interface WalrusUploadResult {
  blobId: string;
  suiRef?: string;
}

interface WalrusStoreResponse {
  newlyCreated?: {
    blobObject?: { blobId?: string; id?: string };
  };
  alreadyCertified?: {
    blobId?: string;
  };
}

function parseBlobIdFromResponse(json: WalrusStoreResponse): string | null {
  return (
    json.newlyCreated?.blobObject?.blobId ??
    json.alreadyCertified?.blobId ??
    null
  );
}

function createWalrusClient(isTestnet: boolean) {
  const config = suiProvider.getConfig();
  const endpoints = getWalrusEndpoints(isTestnet);
  return new SuiJsonRpcClient({ url: config.rpcUrl, network: config.network }).$extend(
    walrus({
      uploadRelay: {
        host: endpoints.uploadRelay,
        sendTip: { max: 5_000_000 },
      },
    })
  );
}

/** Upload via public Walrus publisher HTTP API (testnet). */
export async function uploadBlobHttp(
  data: Uint8Array,
  ownerAddress: string,
  isTestnet: boolean,
  epochs: number = WALRUS_DEFAULT_EPOCHS
): Promise<WalrusUploadResult> {
  const endpoints = getWalrusEndpoints(isTestnet);
  if (!endpoints.publisher) {
    throw new Error('HTTP Walrus publisher is only available on testnet. Use SDK upload on mainnet.');
  }

  const url = `${endpoints.publisher}/v1/blobs?epochs=${epochs}&deletable=true&send_object_to=${encodeURIComponent(ownerAddress)}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: data,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Walrus upload failed (${response.status}): ${text}`);
  }

  const json = (await response.json()) as WalrusStoreResponse;
  const blobId = parseBlobIdFromResponse(json);
  if (!blobId) {
    throw new Error('Walrus upload succeeded but no blobId returned');
  }

  return {
    blobId,
    suiRef: json.newlyCreated?.blobObject?.id,
  };
}

/** Upload via Walrus SDK + upload relay (mainnet and testnet). */
export async function uploadBlobSdk(
  data: Uint8Array,
  identifier: string,
  isTestnet: boolean,
  epochs: number = WALRUS_DEFAULT_EPOCHS
): Promise<WalrusUploadResult> {
  const keypair = await getKeypairOrThrow();
  const address = keypair.toSuiAddress();
  const client = createWalrusClient(isTestnet);

  const file = WalrusFile.from({
    contents: data,
    identifier,
    tags: { 'content-type': 'application/octet-stream' },
  });

  const results = await client.walrus.writeFiles({
    files: [file],
    epochs,
    deletable: true,
    signer: keypair,
  });

  const blobId = results[0]?.blobId;
  if (!blobId) {
    throw new Error('Walrus SDK upload failed: no blobId');
  }

  return { blobId, suiRef: address };
}

/** Smart upload: HTTP on testnet when publisher available, SDK otherwise. */
export async function uploadBlob(
  data: Uint8Array,
  ownerAddress: string,
  isTestnet: boolean,
  identifier: string = 'blob.bin'
): Promise<WalrusUploadResult> {
  const endpoints = getWalrusEndpoints(isTestnet);
  if (isTestnet && endpoints.publisher) {
    try {
      return await uploadBlobHttp(data, ownerAddress, isTestnet);
    } catch (error) {
      console.warn('[Walrus] HTTP upload failed, falling back to SDK:', error);
    }
  }
  return uploadBlobSdk(data, identifier, isTestnet);
}

/** Read blob via Walrus aggregator HTTP API. */
export async function readBlobHttp(blobId: string, isTestnet: boolean): Promise<Uint8Array> {
  const { aggregator } = getWalrusEndpoints(isTestnet);
  const response = await fetch(`${aggregator}/v1/blobs/${encodeURIComponent(blobId)}`);
  if (!response.ok) {
    throw new Error(`Walrus read failed (${response.status})`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

export async function readBlobAsText(blobId: string, isTestnet: boolean): Promise<string> {
  const bytes = await readBlobHttp(blobId, isTestnet);
  return new TextDecoder().decode(bytes);
}

export async function readBlobAsJson<T>(blobId: string, isTestnet: boolean): Promise<T> {
  const text = await readBlobAsText(blobId, isTestnet);
  return JSON.parse(text) as T;
}

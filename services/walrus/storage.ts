import { getWalrusEndpoints, WALRUS_DEFAULT_EPOCHS } from './config';

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

/** Upload via public Walrus publisher HTTP API (testnet). */
export async function uploadBlobHttp(
  data: Uint8Array,
  ownerAddress: string,
  isTestnet: boolean,
  epochs: number = WALRUS_DEFAULT_EPOCHS
): Promise<WalrusUploadResult> {
  const endpoints = getWalrusEndpoints(isTestnet);
  if (!endpoints.publisher) {
    throw new Error(
      'Walrus HTTP publisher is only available on testnet. Mainnet uploads are not supported in the mobile app.'
    );
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

/** Upload blob via Walrus HTTP publisher (React Native–compatible). */
export async function uploadBlob(
  data: Uint8Array,
  ownerAddress: string,
  isTestnet: boolean,
  _identifier: string = 'blob.bin'
): Promise<WalrusUploadResult> {
  return uploadBlobHttp(data, ownerAddress, isTestnet);
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

export class NetworkValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkValidationError';
  }
}

export class WalletConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletConnectionError';
  }
}

export class TransactionExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionExecutionError';
  }
}

import { AppError } from './AppError';

export { AppError };

export class ValidationError extends AppError {
  constructor(details: { field: string; issue: string }[]) {
    super(400, 'VALIDATION_ERROR', 'Request validation failed', details);
  }
}
export class AccountNotFoundError extends AppError {
  constructor(id: number | string) {
    super(404, 'ACCOUNT_NOT_FOUND', `Account ${id} not found`);
  }
}
export class TransactionNotFoundError extends AppError {
  constructor(id: number | string) {
    super(404, 'ACCOUNT_NOT_FOUND', `Account ${id} not found`);
  }
}
export class SameAccountTransferError extends Error {
  constructor() { super('Cannot transfer to the same account'); }
}
export class InvalidAmountError extends Error {
  constructor() { super('Amount must be greater than zero'); }
}
export class DuplicateTransactionError extends AppError {
  constructor(ref?: string) {
    super(409, 'DUPLICATE_TRANSACTION',
      ref ? `reference_id '${ref}' already used for this account` : 'Duplicate transaction');
  }
}
export class InsufficientBalanceError extends AppError {
  constructor() {
    super(422, 'INSUFFICIENT_BALANCE', 'Account balance is insufficient for this debit');
  }
}
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { accountService } from '../accounts/account.service';
import {
  AccountNotFoundError,
  DuplicateTransactionError,
  InsufficientBalanceError,
  TransactionNotFoundError,
  SameAccountTransferError,
  InvalidAmountError
} from '../../errors';
import { CreateTransactionInput,CreateTransferInput } from './transaction.schema';

// one DTO used by create, getAll, and getById
const toDto = (t: {
  id: string;
  accountId: string;
  type: string;
  amount: { toString(): string };
  description: string | null;
  balanceAfter: { toString(): string };
  referenceId: string;
  createdAt: Date;
}) => ({
  id: t.id.toString(),
  account_id: t.accountId.toString(),
  type: t.type,
  amount: t.amount.toString(),
  description: t.description,
  balance_after: t.balanceAfter.toString(),
  reference_id: t.referenceId,
  created_at: t.createdAt,
});

export const transactionService = {
  createTransaction(accountId: string, input: CreateTransactionInput) {
    return prisma.$transaction(async (tx) => {
      const account = await accountService.lockById(accountId, tx);
      if (!account) throw new AccountNotFoundError(accountId);

      const duplicate = await tx.transaction.findUnique({
        where: {
          accountId_referenceId: {
            accountId,
            referenceId: input.reference_id,
          },
        },
      });
      if (duplicate) throw new DuplicateTransactionError(input.reference_id);

      const amount = new Prisma.Decimal(input.amount);
      if (input.type === 'debit' && account.balance.lt(amount))
        throw new InsufficientBalanceError();

      const newBalance =
        input.type === 'credit'
          ? account.balance.plus(amount)
          : account.balance.minus(amount);

      await accountService.updateBalance(accountId, newBalance, tx);

      const transaction = await tx.transaction.create({
        data: {
          accountId,
          type: input.type,
          amount,
          balanceAfter: newBalance,
          referenceId: input.reference_id,
          description: input.description ?? null,
        },
      });

      return {
        transaction: toDto(transaction),
        account: { id: accountId, balance: newBalance.toString() },
      };
    });
  },

    // Transfer money from one account to another (atomic)
  transfer(input: CreateTransferInput) {
    const { from_account_id: fromId, to_account_id: toId } = input;

    if (fromId === toId) throw new SameAccountTransferError();

    const amount = new Prisma.Decimal(input.amount);
    if (amount.lte(0)) throw new InvalidAmountError();

    return prisma.$transaction(async (tx) => {
      // 1. lock BOTH rows in a fixed order (sorted by id) to avoid deadlocks
      const [firstId, secondId] = [fromId, toId].sort();
      const first = await accountService.lockById(firstId, tx);
      const second = await accountService.lockById(secondId, tx);

      const from = firstId === fromId ? first : second;
      const to = firstId === fromId ? second : first;

      if (!from) throw new AccountNotFoundError(fromId);
      if (!to) throw new AccountNotFoundError(toId);

      // 2. idempotency: same reference_id on the sender = retry -> 409
      const duplicate = await tx.transaction.findUnique({
        where: {
          accountId_referenceId: {
            accountId: fromId,
            referenceId: input.reference_id,
          },
        },
      });
      if (duplicate) throw new DuplicateTransactionError(input.reference_id);

      // 3. balance check (safe, both rows are locked)
      if (from.balance.lt(amount)) throw new InsufficientBalanceError();

      const fromNewBalance = from.balance.minus(amount);
      const toNewBalance = to.balance.plus(amount);

      // 4. update both balances
      await accountService.updateBalance(fromId, fromNewBalance, tx);
      await accountService.updateBalance(toId, toNewBalance, tx);

      // 5. record both sides
      const debit = await tx.transaction.create({
        data: {
          accountId: fromId,
          type: 'debit',
          amount,
          balanceAfter: fromNewBalance,
          referenceId: input.reference_id,
          description: input.description ?? `Transfer to ${toId}`,
        },
      });

      const credit = await tx.transaction.create({
        data: {
          accountId: toId,
          type: 'credit',
          amount,
          balanceAfter: toNewBalance,
          referenceId: input.reference_id,
          description: input.description ?? `Transfer from ${fromId}`,
        },
      });

      return {
        from_account: { id: fromId, balance: fromNewBalance.toString() },
        to_account: { id: toId, balance: toNewBalance.toString() },
        debit_transaction: toDto(debit),
        credit_transaction: toDto(credit),
        amount: amount.toString(),
        reference_id: input.reference_id,
      };
    }); // any throw => ROLLBACK
  },

  // GET all transactions of an account (cursor pagination)
  async getAllByAccountId(
    accountId: string,
    opts: { limit?: number; cursor?: string } = {},
  ) {
    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);

    // so a missing account gives 404 instead of an empty list
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true },
    });
    if (!account) throw new AccountNotFoundError(accountId);

    const rows = await prisma.transaction.findMany({
      where: { accountId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1, // one extra row tells us if a next page exists
      ...(opts.cursor && { cursor: { id: opts.cursor }, skip: 1 }),
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    return {
      data: items.map(toDto),
      next_cursor: hasMore ? items[items.length - 1].id : null,
    };
  },

  // GET one transaction by id, scoped to the account in the URL
  async getById(accountId: string, transactionId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, accountId },
    });
    if (!transaction) throw new TransactionNotFoundError(transactionId);
    return toDto(transaction);
  },
};
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AccountNotFoundError } from '../../errors';
import { CreateAccountInput } from './account.schema';

// BigInt and Decimal can't be JSON-serialized, so convert to strings.
const toDto = (a: {
  id: string;
  name: string;
  balance: { toString(): string };
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: a.id,
  name: a.name,
  balance: a.balance.toString(),
  currency: a.currency,
  created_at: a.createdAt,
  updated_at: a.updatedAt,
});

export const accountService = {
  async create(input: CreateAccountInput) {
    const account = await prisma.account.create({ data: { name: input.name } });
    return toDto(account);
  },

  async getById(id: string) {
    const account = await prisma.account.findUnique({ where: { id } });
    if (!account) throw new AccountNotFoundError(id);
    return toDto(account);
  },

  // Row lock for transactions/transfers. Call only with the `tx` client
  // inside prisma.$transaction.
  async lockById(id: string, tx: Prisma.TransactionClient) {
    const rows = await tx.$queryRaw<{ id: string; balance: Prisma.Decimal }[]>`
      SELECT id, balance FROM accounts WHERE id = ${id} FOR UPDATE`;
    return rows[0] ?? null;
  },

  updateBalance(id:string, balance: Prisma.Decimal, tx: Prisma.TransactionClient) {
    return tx.account.update({ where: { id }, data: { balance } });
  },
};
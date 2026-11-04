
import { PoolClient } from 'pg';
export const transactionRepository = {
  async existsByReference(client: PoolClient, accountId: number, referenceId: string) {
    const { rowCount } = await client.query(
      'SELECT 1 FROM transactions WHERE account_id = $1 AND reference_id = $2',
      [accountId, referenceId],
    );
    return (rowCount ?? 0) > 0;
  },

  async insert(
    client: PoolClient,
    d: {
      accountId: number;
      type: 'credit' | 'debit';
      amount: string;
      balanceAfter: string;
      referenceId: string;
      description?: string;
    },
  ) {
    const { rows } = await client.query(
      `INSERT INTO transactions
         (account_id, type, amount, balance_after, reference_id, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, account_id, type, amount, balance_after, reference_id, description, created_at`,
      [d.accountId, d.type, d.amount, d.balanceAfter, d.referenceId, d.description ?? null],
    );
    return rows[0];
  },
};
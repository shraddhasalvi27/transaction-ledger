import { z } from 'zod';

export const createTransactionSchema = {
  params: z.object({
  id: z.uuid({ error: 'Account id must be a valid UUID' }),
}),
  body: z
    .object({
      type: z.enum(['credit', 'debit'], {
         error: "type must be 'credit' or 'debit'",
      }),
      amount: z
        .union([z.string(), z.number()])
        .transform((v) => String(v))
        .refine((v) => /^\d{1,15}(\.\d{1,4})?$/.test(v) && Number(v) > 0, {
          message: 'amount must be greater than 0 with at most 4 decimal places',
        }),
      description: z
      .string()
      .trim()
      .max(255, 'description must be at most 255 characters')
      .optional(),
      reference_id: z.string().trim().min(1, 'reference_id is required').max(100),
      // description: z.string().trim().max(255).optional(),
    })
    .strict(),
};

export const CreateTransferSchema = z.object({
  from_account_id: z.string().min(1),
  to_account_id: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'invalid amount'), // positive decimal as string
  reference_id: z.string().min(1),
  description: z.string().optional(),
});

export type CreateTransferInput = z.infer<typeof CreateTransferSchema>;
export type CreateTransactionInput = {
  type: 'credit' | 'debit';
  amount: string;
  reference_id: string;
  description?: string;
}; 
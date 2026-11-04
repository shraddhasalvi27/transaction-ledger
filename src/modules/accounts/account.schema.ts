import { z } from 'zod';

export const createAccountSchema = {
  body: z.strictObject({
    name: z
      .string({ error: 'name is required' })
      .trim()
      .min(1, 'name is required')
      .max(150, 'name must be at most 150 characters'),
  }),
};
  
export const getAccountSchema = {
  params: z.object({
    id: z.uuid({ error: 'Account id must be a valid UUID' }),
  }),
};

export type CreateAccountInput = { name: string };
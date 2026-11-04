import { Pool } from 'pg';
// import { env } from '../config/env';
import { env } from '../config/env.ts';

// NUMERIC columns come back as strings, which is what we want for money.
export const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });
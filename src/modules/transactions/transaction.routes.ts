import { Router } from 'express';
// import { validate } from '../../middlewares/validate';
import { validate } from '../../middleware/validate.js';
import { createTransactionSchema } from './transaction.schema.js';
import { transactionController } from './transaction.controller.js';
import { getAccountSchema } from '../accounts/account.schema.js';
import { CreateTransferSchema } from './transaction.schema.js';
const router = Router();

router.post('/:id/transactions', validate(createTransactionSchema), transactionController.create);

router.get('/:id/transactions',validate(getAccountSchema),transactionController.getAll);

// router.post('/', validate(CreateTransferSchema), transactionController.transfer);
export default router;
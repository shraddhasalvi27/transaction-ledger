import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { createAccountSchema, getAccountSchema } from './account.schema';
import { accountController } from './account.controller';

const router = Router();

router.post('/', validate(createAccountSchema), accountController.create);
router.get('/:id', validate(getAccountSchema), accountController.getById);

export default router;
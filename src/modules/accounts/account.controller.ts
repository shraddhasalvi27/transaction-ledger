import { Request, Response } from 'express';
import { accountService } from './account.service';

export const accountController = {
  async create(_req: Request, res: Response) {
    const { body } = res.locals.valid;
    const data = await accountService.create(body);
    res.status(201).json({ data });
  },

  async getById(_req: Request, res: Response) {
    const { params } = res.locals.valid;
    const data = await accountService.getById(params.id);
    res.json({ data });
  },
};
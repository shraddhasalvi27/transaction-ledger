import { Request, Response } from 'express';
import { transactionService } from './transaction.service';
export const transactionController = {
  async create(_req: Request, res: Response) {
    const { params, body } = res.locals.valid;
    const result = await transactionService.createTransaction(params.id, body);
    res.status(201).json({ data: result });
  },

  async getAll(_req:Request,res:Response){
    const {params} = res.locals.valid;
    const result = await transactionService.getAllByAccountId(params.id);
    res.json({data:result});
  },
   async transfer(_req: Request, res: Response) {
    const { body } = res.locals.valid;
    const result = await transactionService.transfer(body);
    res.status(201).json({ data: result });
  },
};
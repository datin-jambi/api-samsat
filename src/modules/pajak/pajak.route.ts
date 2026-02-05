import { Router } from 'express';
import * as pajakController from './pajak.controller';
import { validate } from '../../middlewares/validate.middleware';
import { 
  getPajakByNopolSchema 
} from './pajak.validation';

/**
 * Pajak Routes
 * 
 * Mapping URL ke controller dengan validation middleware
 */
const router = Router();


// POST /api/pajak/detail
router.post(
  '/detail', 
  validate(getPajakByNopolSchema),
  pajakController.getPajakByNopol
);

export default router;

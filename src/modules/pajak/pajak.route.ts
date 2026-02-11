import { Router } from 'express';
import * as pajakController from './pajak.controller';
import { validate } from '../../middlewares/validate.middleware';
import { 
  getPajakByNopolQuerySchema
} from './pajak.validation';

/**
 * Pajak Routes
 * 
 * Mapping URL ke controller dengan validation middleware
 */
const router = Router();

// GET /api/pajak/detail?nopol=xxx (NEW - Recommended)
router.get(
  '/detail',
  validate(getPajakByNopolQuerySchema),
  pajakController.getPajakByNopolQuery
);

export default router;

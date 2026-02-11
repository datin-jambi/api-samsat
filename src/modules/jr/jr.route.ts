import { Router } from 'express';
import * as jrController from './jr.controller';
import { validate } from '../../middlewares/validate.middleware';
import { 
  getJrByNopolQuerySchema
} from './jr.validation';

/** 
 * Jr Routes
 * 
 * Mapping URL ke controller dengan validation middleware
 */
const router = Router();

// GET /api/jr/detail?nopol=xxx (NEW - Recommended)
router.get(
  '/detail',
  validate(getJrByNopolQuerySchema),
  jrController.getJrByNopolQuery
);

export default router;

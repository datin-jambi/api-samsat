import { Router } from 'express';
import * as jrController from './jr.controller';
import { validate } from '../../middlewares/validate.middleware';
import { 
  getJrByNopolSchema 
} from './jr.validation';

/** 
 * Jr Routes
 * 
 * Mapping URL ke controller dengan validation middleware
 */
const router = Router();


// POST /api/jr/detail
router.post(
  '/detail', 
  validate(getJrByNopolSchema),
  jrController.getJrByNopol
);

export default router;

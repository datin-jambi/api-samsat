import { Router } from 'express';
import * as kendaraanController from './kendaraan.controller';
import { validate } from '../../middlewares/validate.middleware';
import { 
  getAllKendaraanSchema,
  getKendaraanByNopolQuerySchema
} from './kendaraan.validation';

/**
 * Kendaraan Routes
 * 
 * Mapping URL ke controller dengan validation middleware
 */
const router = Router();

// GET /api/kendaraan 
router.get(
  '/', 
  validate(getAllKendaraanSchema),
  kendaraanController.getAllKendaraan
);

// GET /api/kendaraan/detail?nopol=xxx (NEW - Recommended)
router.get(
  '/detail',
  validate(getKendaraanByNopolQuerySchema),
  kendaraanController.getKendaraanByNopolQuery
);


// GET /api/kendaraan/pnbp
router.get(
  '/pnbp', 
  validate(getKendaraanByNopolQuerySchema),
  kendaraanController.getPnbpKendaraan
);

export default router;

import { Router } from 'express';
import * as kendaraanController from './kendaraan.controller';
import { validate } from '../../middlewares/validate.middleware';
import { 
  getAllKendaraanSchema,
  getKendaraanByNopolSchema 
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

// POST /api/kendaraan/detail
router.post(
  '/detail', 
  validate(getKendaraanByNopolSchema),
  kendaraanController.getKendaraanByNopol
);

// POST /api/kendaraan/pnbp
router.post(
  '/pnbp', 
  validate(getKendaraanByNopolSchema),
  kendaraanController.getPnbpKendaraan
);

export default router;

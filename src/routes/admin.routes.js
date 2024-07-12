import { Router } from 'express';
import {
  checkAdminController,
  getGroupDataController,
  getMessageDataController,
  getStatsController,
  getUserDataController,
  loginAdminController,
  logoutAdminController
} from '../controllers/admin.controller.js';
import { authenticateAdmin, secretKeyValidator } from '../middlewares/admin.middlewares.js';
import { wrapperError } from '../utils/wrapperError.js';

const adminRoute = Router();

adminRoute.post('/login', secretKeyValidator, wrapperError(loginAdminController));

adminRoute.use(authenticateAdmin);
adminRoute.get('/', checkAdminController);
adminRoute.post('/logout', wrapperError(logoutAdminController));
adminRoute.get('/user', wrapperError(getUserDataController));
adminRoute.get('/group', wrapperError(getGroupDataController));
adminRoute.get('/messages', wrapperError(getMessageDataController));
adminRoute.get('/stats', wrapperError(getStatsController));
export default adminRoute;

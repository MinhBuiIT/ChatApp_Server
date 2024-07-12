import { Router } from 'express';
import {
  notifacationsController,
  reactRequestController,
  sendRequestController
} from '../controllers/request.controller.js';
import { reactRequestValidator, sendRequestValidator } from '../middlewares/request.middlewares.js';
import { authenticatedValidator } from '../middlewares/user.middlewares.js';
import { wrapperError } from '../utils/wrapperError.js';

const requestRoute = Router();
requestRoute.post('/send', authenticatedValidator, sendRequestValidator, wrapperError(sendRequestController));
requestRoute.post('/react', authenticatedValidator, reactRequestValidator, wrapperError(reactRequestController));
//Liệt kê tất cả thông báo
requestRoute.get('/notify', authenticatedValidator, notifacationsController);
export default requestRoute;

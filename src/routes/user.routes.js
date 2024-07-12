import { Router } from 'express';
import {
  getMyFriendsController,
  getProfileController,
  loginController,
  logoutController,
  registerController,
  searchUserController
} from '../controllers/user.controller.js';
import { authenticatedValidator, loginValdator, registerValidator } from '../middlewares/user.middlewares.js';
import { uploadMulterRegister } from '../utils/multer.js';
import { wrapperError } from '../utils/wrapperError.js';

const userRoute = Router();

userRoute.post('/register', uploadMulterRegister, registerValidator, wrapperError(registerController));

userRoute.post('/login', loginValdator, wrapperError(loginController));

//Đăng nhập rồi mới truy cập các endpoint này được
userRoute.get('/profile', authenticatedValidator, wrapperError(getProfileController));
userRoute.post('/logout', authenticatedValidator, wrapperError(logoutController));

userRoute.get('/search', authenticatedValidator, wrapperError(searchUserController));
userRoute.get('/my-friend', authenticatedValidator, wrapperError(getMyFriendsController));
export default userRoute;

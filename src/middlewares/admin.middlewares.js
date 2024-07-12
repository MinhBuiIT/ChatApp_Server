import { checkSchema } from 'express-validator';
import jwt from 'jsonwebtoken';
import { ErrorMessage } from '../models/error.models.js';
import validate from '../utils/validate.js';
export const secretKeyValidator = validate(
  checkSchema({
    secret_key: {
      notEmpty: {
        errorMessage: 'Secret key is required'
      }
    }
  })
);
export const authenticateAdmin = (req, res, next) => {
  const tokenAdmin = req.cookies['token-admin'];
  if (!tokenAdmin) {
    return next(new ErrorMessage({ message: 'Unauthorized', status: 401 }));
  }
  try {
    const decoded = jwt.verify(tokenAdmin, process.env.COOKIE_KEY_ADMIN);
    next();
  } catch (error) {
    next(new ErrorMessage({ message: error.message, status: 401 }));
  }
};

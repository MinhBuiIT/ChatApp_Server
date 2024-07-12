import { checkSchema } from 'express-validator';
import jwt from 'jsonwebtoken';
import { REGEX_PASSWORD } from '../constants/regex.constants.js';
import { ErrorMessage } from '../models/error.models.js';
import User from '../models/user.models.js';
import { verifyToken } from '../utils/jsonwebtoken.js';
import validate from '../utils/validate.js';

export const registerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: 'Name is required'
        },
        isString: {
          errorMessage: 'Name must be a string'
        }
      },
      username: {
        notEmpty: {
          errorMessage: 'Username is required'
        },
        isString: {
          errorMessage: 'Username must be a string'
        },
        trim: true,
        custom: {
          options: async (value) => {
            const userExist = await User.findOne({ username: value });
            if (userExist) {
              throw new Error('Username already exists');
            }
            return true;
          }
        }
      },
      bio: {
        notEmpty: {
          errorMessage: 'Bio is required'
        },
        isString: {
          errorMessage: 'Bio must be a string'
        }
      },
      password: {
        notEmpty: {
          errorMessage: 'Password is required'
        },
        isString: {
          errorMessage: 'Password must be a string'
        },
        matches: {
          options: REGEX_PASSWORD,
          errorMessage: 'Minimum eight characters, at least one letter, one number and one special character'
        }
      }
    },
    ['body']
  )
);
export const loginValdator = validate(
  checkSchema(
    {
      username: {
        notEmpty: {
          errorMessage: 'Invalid Username Or Password'
        }
      },
      password: {
        notEmpty: {
          errorMessage: 'Invalid Username Or Password'
        }
      }
    },
    ['body']
  )
);
export const authenticatedValidator = async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorMessage({ message: 'Unauthenticated', status: 401 }));
  }
  try {
    const decoded = await verifyToken(token, process.env.COOKIE_KEY);
    req.user_id = decoded.id;
  } catch (error) {
    next(new ErrorMessage({ message: error.message, status: 401 }));
  }
  next();
};
export const socketAuthenValidator = async (err, socket, next) => {
  try {
    if (err) return next(err);
    const tokenCookie = socket.request.cookies?.token;
    // console.log('TokenCookie', tokenCookie);
    if (!tokenCookie) return next(new Error('Authentication error'));
    const decoded = jwt.verify(tokenCookie, process.env.COOKIE_KEY);
    //tim user trong db
    const user = await User.findById(decoded.id).lean();
    if (!user) return next(new Error('Authentication error'));
    socket.request.user = user;
    return next();
  } catch (error) {
    next(error);
  }
};

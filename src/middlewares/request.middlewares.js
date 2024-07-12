import { checkSchema } from 'express-validator';
import mongoose from 'mongoose';
import { ErrorMessage } from '../models/error.models.js';
import User from '../models/user.models.js';
import validate from '../utils/validate.js';

export const sendRequestValidator = validate(
  checkSchema({
    receiver_id: {
      custom: {
        options: async (value) => {
          if (!value) {
            throw new ErrorMessage({ message: 'Receiver id not empty', status: 400 });
          }
          if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new ErrorMessage({ message: 'Receiver id invalid', status: 400 });
          }
          const userReceiver = await User.findById(value).lean();
          if (!userReceiver) {
            throw new ErrorMessage({ message: 'Receiver not found', status: 404 });
          }
          return true;
        }
      }
    }
  })
);
export const reactRequestValidator = validate(
  checkSchema({
    request_id: {
      custom: {
        options: async (value) => {
          if (!value) {
            throw new ErrorMessage({ message: 'Request id not empty', status: 400 });
          }
          if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new ErrorMessage({ message: 'Request id invalid', status: 400 });
          }
          return true;
        }
      }
    },
    accepted: {
      custom: {
        options: async (value) => {
          if (![0, 1].includes(value)) {
            throw new ErrorMessage({ message: 'Accept must be 0 or 1', status: 400 });
          }
          return true;
        }
      }
    }
  })
);

import { checkSchema } from 'express-validator';
import mongoose from 'mongoose';
import Chat from '../models/chat.models.js';
import { ErrorMessage } from '../models/error.models.js';
import User from '../models/user.models.js';
import validate from '../utils/validate.js';

const checkValidMembers = async (value, { req }) => {
  if (!Array.isArray(value)) {
    throw new ErrorMessage({ message: 'Members must be an array', status: 400 });
  }
  //Kiểm tra id có hợp lệ không
  const isValidObjectId = value.every((id) => mongoose.isValidObjectId(id));
  if (!isValidObjectId) {
    throw new ErrorMessage({ message: 'Members is invalid', status: 400 });
  }
  //Kiểm tra id có tồn tại không
  const userListMembers = await Promise.all(value.map((id) => User.findById(id, 'name')));
  const isValid = userListMembers.some((item) => !item);
  if (isValid) {
    throw new ErrorMessage({ message: 'Members not found', status: 404 });
  }
  return true;
};
const checkChatId = {
  notEmpty: {
    message: 'Chat id is required'
  },
  custom: {
    options: async (value, { req }) => {
      if (!mongoose.isValidObjectId(value)) {
        throw new ErrorMessage({ message: 'Chat id is invalid', status: 400 });
      }
      const chat = await Chat.findById(value);
      if (!chat) {
        throw new ErrorMessage({ message: 'Chat is not found', status: 404 });
      }
      req.chat = chat;
      return true;
    }
  }
};
export const addGroupValidator = validate(
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
      members: {
        custom: {
          options: checkValidMembers
        }
      }
    },
    ['body']
  )
);
export const addMemberGroupValidator = validate(
  checkSchema(
    {
      chat_id: checkChatId,
      members: {
        custom: {
          options: checkValidMembers
        }
      }
    },
    ['body']
  )
);
export const removeMemberGroupValidator = validate(
  checkSchema(
    {
      chat_id: checkChatId,
      member_id: {
        notEmpty: {
          message: 'Member id is required'
        },
        custom: {
          options: async (value, { req }) => {
            if (!mongoose.isValidObjectId(value)) {
              throw new ErrorMessage({ message: 'Member id is invalid', status: 400 });
            }

            return true;
          }
        }
      }
    },
    ['body']
  )
);
export const leaveGroupValidator = validate(
  checkSchema(
    {
      chat_id: checkChatId
    },
    ['params']
  )
);

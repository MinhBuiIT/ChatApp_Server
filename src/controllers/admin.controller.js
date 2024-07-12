import jwt from 'jsonwebtoken';
import { ErrorMessage } from '../models/error.models.js';
import User from '../models/user.models.js';
import AdminService from '../services/admin.services.js';
import config from '../utils/config.js';
import { pickInfoObject } from '../utils/lodashUtils.js';

config();
export const loginAdminController = async (req, res, next) => {
  const { secret_key } = req.body;
  const secretKey = process.env.SECRET_KEY;
  if (secret_key !== secretKey) {
    return next(new ErrorMessage({ message: 'Invalid secret key', status: 401 }));
  }
  const cookieConfig = {
    maxAge: 24 * 60 * 60 * 1000, //1 ngày,
    httpOnly: true,
    sameSite: 'none',
    secure: true
  };
  const tokenAdmin = jwt.sign({ admin: 'admin' }, process.env.COOKIE_KEY_ADMIN);
  return res.status(200).cookie('token-admin', tokenAdmin, cookieConfig).json({ message: 'Login Admin successfully' });
};
export const logoutAdminController = async (req, res, next) => {
  return res.status(200).clearCookie('token-admin').json({ message: 'Logout Admin successfully' });
};
export const checkAdminController = async (req, res, next) => {
  return res.status(200).json({ message: 'Admin is authenticated' });
};
export const getUserDataController = async (req, res, next) => {
  const userData = await AdminService.getUserData();
  return res.status(200).json({ message: 'Get user data successfully', result: userData });
};
export const getGroupDataController = async (req, res, next) => {
  const groupData = await AdminService.getGroupData();
  const groupDataConfig = groupData.map(({ _id, name, creator, members, totalMembers, totalMessages }) => {
    const membersConfig = members.map((member) => {
      return pickInfoObject(member, ['_id', 'name', 'avatar.url']);
    });
    return {
      _id,
      name,
      creator: pickInfoObject(creator, ['_id', 'name', 'avatar.url']),
      members: membersConfig,
      avatar: membersConfig.slice(0, 3).map((member) => member.avatar.url),
      totalMembers,
      totalMessages
    };
  });
  return res.status(200).json({ message: 'Get group data successfully', result: groupDataConfig });
};
export const getMessageDataController = async (req, res, next) => {
  const messageData = await AdminService.getMessageData();
  const messageDataConfig = await Promise.all(
    messageData.map(async ({ _id, sender, chat_id, content, attachments, createdAt }) => {
      let nameChat = chat_id.name;
      const members = chat_id.members;
      const isGroup = chat_id.isGroup;
      //Nếu không phải là nhóm thì lấy tên của 2 người chat
      if (!isGroup) {
        const [name1, name2] = await Promise.all(
          members.map(async (member) => {
            return await User.findById(member).select('name').lean();
          })
        );
        nameChat = `${name1.name} - ${name2.name}`;
      }
      return {
        _id,
        sender: {
          ...sender,
          avatar: sender.avatar.url
        },
        chat: {
          _id: chat_id._id,
          name: nameChat,
          isGroup
        },
        content,
        attachments,
        createdAt
      };
    })
  );
  return res.status(200).json({ message: 'Get message data successfully', result: messageDataConfig });
};
export const getStatsController = async (req, res, next) => {
  const stats = await AdminService.getStats();
  return res.status(200).json({ message: 'Get stats successfully', result: stats });
};

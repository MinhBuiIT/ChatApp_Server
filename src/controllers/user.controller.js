import Chat from '../models/chat.models.js';
import { ErrorMessage } from '../models/error.models.js';
import User from '../models/user.models.js';
import RequestService from '../services/request.services.js';
import UserService from '../services/user.services.js';
import config from '../utils/config.js';
import { signToken } from '../utils/jsonwebtoken.js';

config();
export const registerController = async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorMessage({ message: 'Avatar is required', status: 422 }));
  }

  const userConfig = await UserService.registerService(req.file, req.body);
  const token = await signToken({ id: userConfig._id }, process.env.COOKIE_KEY);
  const cookieConfig = {
    maxAge: 15 * 24 * 60 * 60 * 1000, //15 ngày,
    httpOnly: true,
    sameSite: 'none',
    secure: true
  };
  return res
    .status(201)
    .cookie('token', token, cookieConfig)
    .json({ message: 'Register successfully', result: userConfig });
};

export const loginController = async (req, res, next) => {
  const user = await UserService.loginService(req.body);
  const token = await signToken({ id: user._id }, process.env.COOKIE_KEY);
  const cookieConfig = {
    maxAge: 15 * 24 * 60 * 60 * 1000, //15 ngày,
    httpOnly: true,
    sameSite: 'none',
    secure: true
  };
  return res.status(200).cookie('token', token, cookieConfig).json({ message: 'Login successful', result: user });
};
export const getProfileController = async (req, res, next) => {
  const user_id = req.user_id;
  const profileUser = await User.findById(user_id);
  return res.status(200).json({
    message: 'Get Profile Successfully',
    result: profileUser
  });
};
export const logoutController = async (req, res, next) => {
  return res.status(200).cookie('token', '', { maxAge: 0 }).json({ message: 'Logout successful' });
};
export const searchUserController = async (req, res, next) => {
  const { name = '' } = req.query;
  //tìm các friends
  const user_id = req.user_id;
  const userFriends = await UserService.findFriendsId(user_id);
  //tìm các user không phải friends và match với name
  const usersNotFriends = await User.find({
    _id: { $nin: [...userFriends, user_id] },
    name: { $regex: name, $options: 'i' }
  }).lean();
  //tìm request của user_id
  const requestSended = (await RequestService.findSenderRequestService(user_id)) || [];
  const usersNotFriendsConfig = usersNotFriends.map(({ _id, name, avatar }) => {
    const isRequestSended = requestSended.some((request) => request.receiver.toString() === _id.toString());
    return {
      _id,
      name,
      avatar: avatar?.url || null,
      isRequestSended
    };
  });

  return res.status(200).json({
    message: 'Get User Successfully',
    result: usersNotFriendsConfig
  });
};
export const getMyFriendsController = async (req, res, next) => {
  const chatId = req.query.chatId;
  const user_id = req.user_id;
  let userFriends = await UserService.findFriendsInfo(user_id);

  //Khi truyền chatId vào thì chỉ trả về những bạn bè ngoài trừ những bạn bè trong chat đó
  if (chatId) {
    const chat = await Chat.findById(chatId).lean();
    const members = chat.members.map((member) => member.toString());
    userFriends = userFriends.filter((friend) => {
      const filter = !members.includes(friend._id.toString());
      return filter;
    });
  }
  return res.status(200).json({
    message: 'Get friends successfully',
    result: userFriends
  });
};

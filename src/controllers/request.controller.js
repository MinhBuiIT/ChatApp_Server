import emitConstants from '../constants/emit.constants.js';
import Chat from '../models/chat.models.js';
import { ErrorMessage } from '../models/error.models.js';
import Request from '../models/request.models.js';
import RequestService from '../services/request.services.js';
import UserService from '../services/user.services.js';
import { emitEvent } from '../utils/emitEvent.js';

const { REFRESH_CHATS, ALERT } = emitConstants;
export const sendRequestController = async (req, res, next) => {
  const { receiver_id } = req.body;
  const sender_id = req.user_id;
  //check request đã tồn tại chưa
  const requestExist = await RequestService.checkRequestExistService(sender_id, receiver_id);
  if (requestExist) {
    return next(new ErrorMessage({ message: 'Request already sent', status: 400 }));
  }

  const friends = await UserService.findFriendsId(sender_id);
  const friendsConfig = friends.map((fr) => fr.toString());

  //check receiver_id có phải là friend không
  if (friendsConfig.includes(receiver_id.toString())) {
    return next(new ErrorMessage({ message: 'Receiver invalid', status: 400 }));
  }
  await RequestService.creatRequestService(sender_id, receiver_id);
  //emit event
  emitEvent(req, ALERT, [{ _id: receiver_id }], { message: 'You have a new friend request', receiver_id });
  return res.status(201).json({ message: 'Send request successfully' });
};
export const reactRequestController = async (req, res, next) => {
  const { request_id, accepted } = req.body;

  const request = await Request.findById(request_id);
  if (!request) {
    return next(new ErrorMessage({ message: 'Request not found', status: 404 }));
  }
  if (request.receiver.toString() !== req.user_id.toString()) {
    return next(new ErrorMessage({ message: 'You are authorized this request', status: 403 }));
  }
  if (accepted === 0) {
    await request.deleteOne();
    return res.status(200).json({ message: 'Reject request successfully' });
  }

  const members = [request.sender, request.receiver];
  const membersConfig = members.map((member) => ({ _id: member.toString() }));
  await Chat.create({ members, isGroup: false, name: '', creator: null });
  await request.deleteOne();
  //Emit event
  emitEvent(req, REFRESH_CHATS, membersConfig);
  return res.status(200).json({ message: 'Accept request successfully' });
};
export const notifacationsController = async (req, res, next) => {
  const user_id = req.user_id;
  const requests = await Request.find({ receiver: user_id }).populate('sender', '_id name avatar').lean();
  const requestsConfig = requests.map((request) => {
    return {
      ...request,
      sender: {
        ...request.sender,
        avatar: request.sender.avatar.url
      }
    };
  });
  return res.status(200).json({ message: 'Get request list successfully', result: requestsConfig });
};

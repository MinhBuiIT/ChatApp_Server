import mongoose from 'mongoose';
import emitConstants from '../constants/emit.constants.js';
import Chat from '../models/chat.models.js';
import { ErrorMessage } from '../models/error.models.js';
import Message from '../models/message.models.js';
import User from '../models/user.models.js';
import ChatService from '../services/chat.services.js';
import { uploadFileCloudBuffer } from '../utils/cloudinary.js';
import { emitEvent } from '../utils/emitEvent.js';
import { getExtensionFile, getNameFile } from '../utils/helper.js';

const { ALERT, REFRESH_CHATS, TOAST, ALERT_GROUP, REFRESH_CHATS_NAV } = emitConstants;
export const createNewGroupController = async (req, res, next) => {
  const { allMembers, membersUnique } = await ChatService.createNewGroupService(req.body, req.user_id);
  //Emit event
  const userCreateGroup = await User.findById(req.user_id, 'name').lean();
  const memberUniqueConfig = membersUnique.map((member) => ({ _id: member }));
  const allMembersConfig = allMembers.map((member) => ({ _id: member }));
  emitEvent(req, TOAST, memberUniqueConfig, {
    message: `${userCreateGroup.name} have added you the ${req.body.name} group`
  });
  emitEvent(req, REFRESH_CHATS, allMembersConfig, { message: 'Refresh Chat List' });
  return res.status(201).json({ message: 'Group created successfully' });
};
export const getMyListController = async (req, res) => {
  const user_id = req.user_id;
  const chatsConfig = await ChatService.getMyListService(user_id);
  return res.status(200).json({ message: 'Get Chat List Successfully', result: chatsConfig });
};
export const getMyGroupController = async (req, res) => {
  const user_id = req.user_id;
  const chatsConfig = await ChatService.getMyGroupService(user_id);
  return res.status(200).json({ message: 'Get Group Chat List Successfully', result: chatsConfig });
};
export const addMemberController = async (req, res) => {
  const { members } = req.body;
  const chat = req.chat;
  const { membersAdded } = await ChatService.addMemberService(chat, members);
  //Tìm tên của thành viên vừa thêm
  const membersAddedArr = await Promise.all(membersAdded.map((id) => User.findById(id, 'name')));
  //Emit event
  const nameMembers = membersAddedArr.map((member) => member.name);
  const membersChatNew = [...chat.members, ...members];
  const memberNotMe = membersChatNew
    .filter((member) => member.toString() !== req.user_id.toString())
    .map((member) => ({ _id: member.toString() }));
  emitEvent(req, ALERT_GROUP, memberNotMe, {
    chatId: chat._id,
    message: `Member ${nameMembers.join(', ')} has been added`
  });
  emitEvent(req, REFRESH_CHATS, memberNotMe);
  return res.status(200).json({ message: 'Add Member Successfully' });
};
export const removeMemberController = async (req, res) => {
  const { member_id } = req.body;
  const chat = req.chat;
  //Kiểm tra thành viên có trong group không
  if (!chat.members.includes(member_id)) {
    throw new ErrorMessage({ message: 'Member is not in the group', status: 400 });
  }
  //Kiểm tra số thành viên phải lớn hơn 3 mới được xóa
  if (chat.members.length <= 3) {
    throw new ErrorMessage({ message: 'Members must be at least 3 members', status: 400 });
  }
  await ChatService.removeMemberService(chat, member_id);
  //Tìm tên của thành viên vừa xóa
  const membersRemovedArr = await User.findById(member_id, 'name');
  const membersNotMe = chat.members
    .filter((member) => member.toString() !== req.user_id.toString())
    .map((member) => ({ _id: member.toString() }));
  //Emit event
  emitEvent(req, ALERT_GROUP, membersNotMe, {
    chatId: chat._id,
    message: `Member ${membersRemovedArr.name} has been removed from the group`
  });
  emitEvent(req, REFRESH_CHATS_NAV, [{ _id: member_id.toString() }], { chatId: chat._id.toString() });
  return res.status(200).json({ message: 'Remove Member Successfully' });
};
export const leaveGroupController = async (req, res) => {
  const chat = req.chat;
  const user_id = req.user_id;
  //Kiểm tra thành viên có trong group không
  if (!chat.members.includes(user_id)) {
    throw new ErrorMessage({ message: 'Member is not in the group', status: 400 });
  }

  const newCreator = await ChatService.leaveGroupService(chat, user_id);
  //Tìm tên của thành viên vừa xóa
  const membersRemovedArr = await User.findById(user_id, 'name');
  const memberNotMemberLeave = chat.members
    .filter((member) => member.toString() !== user_id.toString())
    .map((member) => ({ _id: member.toString() }));
  //Emit event
  console.log('memberNotMemberLeave', memberNotMemberLeave);
  emitEvent(req, ALERT_GROUP, memberNotMemberLeave, {
    chatId: chat._id.toString(),
    message: `Member ${membersRemovedArr.name} has left the group.${
      !!newCreator ? ` ${newCreator.name} is the new group administrator` : ''
    }`
  });
  emitEvent(req, REFRESH_CHATS_NAV, [{ _id: user_id.toString() }], { chatId: chat._id.toString() });
  return res.status(200).json({ message: 'Leave Group Successfully' });
};
//
export const getChatDetailController = async (req, res, next) => {
  const { id } = req.params;
  const { populate } = req.query;
  if (mongoose.Types.ObjectId.isValid(id) === false) {
    throw new ErrorMessage({ message: 'Chat id is invalid', status: 400 });
  }
  const chatDetail = await ChatService.getChatDetailService(id, populate, req.user_id);
  if (!chatDetail) {
    throw new ErrorMessage({ message: 'Chat not found', status: 404 });
  }
  return res.status(200).json({ message: 'Get chat detail successfully', result: chatDetail });
};
export const renameGroupController = async (req, res, next) => {
  const { id } = req.params;
  const user_id = req.user_id;
  const { name } = req.body;

  const chat = await ChatService.renameGroupService(id, user_id, name);
  const members = chat.members.map((item) => ({ _id: item.toString() }));
  const memberNotMe = members.filter((member) => member._id.toString() !== user_id.toString());
  //Emit event
  emitEvent(req, emitConstants.REFRESH_CHATS, memberNotMe, { message: 'Refresh Chat List' });
  emitEvent(req, emitConstants.ALERT_GROUP, memberNotMe, {
    chatId: id,
    message: `Group name has been changed to ${name}`
  });
  return res.status(200).json({ message: 'Rename group successfully' });
};
export const deleteChatController = async (req, res, next) => {
  const { id } = req.params;
  const user_id = req.user_id;
  const chat = await Chat.findById(id);
  if (!chat) {
    throw new ErrorMessage({ message: 'Chat not found', status: 404 });
  }
  const members = chat.members;
  const membersNotMe = members
    .filter((member) => member.toString() !== user_id.toString())
    .map((member) => ({ _id: member.toString() }));
  await ChatService.deleteChatService(chat, user_id);
  emitEvent(req, TOAST, membersNotMe, { message: `Chat ${chat.name} has been deleted` });
  emitEvent(req, REFRESH_CHATS_NAV, [...membersNotMe, { _id: user_id.toString() }], { chatId: chat._id.toString() });
  console.log('Delete chat successfully');
  return res.status(200).json({ message: 'Delete chat successfully' });
};
export const getMessageChatController = async (req, res, next) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const user_id = req.user_id;
  const { messages, totalPages } = await ChatService.getMessageChatService(id, user_id, page, limit);
  return res.status(200).json({
    message: 'Get message chat successfully',
    result: {
      messages,
      totalPages,
      limit,
      page
    }
  });
};
export const attachmentController = async (req, res, next) => {
  const files = req.files;
  if (!files || !files.length) {
    throw new ErrorMessage({ message: 'File is required', status: 400 });
  }
  const chat = await Chat.findById(req.params.chatId).lean();
  const chatMembers = chat.members.map((item) => item.toString());
  if (!chatMembers.includes(req.user_id)) {
    throw new ErrorMessage({ message: 'You are not a member of this group', status: 400 });
  }

  //Upload file to cloudinary
  const resultUpload = await Promise.all(
    files.map(async (file) => {
      return await uploadFileCloudBuffer(file);
    })
  );
  // console.log('resultUpload', resultUpload);
  const attachmentsLink = resultUpload.map((file) => {
    let type = 'file';
    if (file.resource_type === 'image') type = 'image';
    if (file.resource_type === 'video') {
      type = 'video';
      if (Object.keys(file.audio).length > 0) type = 'audio';
    }

    const public_id = file.public_id.split('/')[1];
    if (type === 'file') {
      const nameFile = getNameFile(file.display_name);
      const extention = getExtensionFile(file.display_name);
      const nameOriginal = nameFile.split('_')[0] + `.${extention}`;
      return { url: file.secure_url, public_id, file_type: type, file_name: nameOriginal };
    }
    return { url: file.secure_url, public_id, file_type: type };
  });
  const nanoid = (await import('nanoid')).nanoid;
  const user = await User.findById(req.user_id, 'name avatar').lean();
  //Emit event
  const attachmentForRealTime = {
    _id: nanoid(),
    chat_id: req.params.chatId,
    content: '',
    createdAt: new Date().toISOString(),
    attachments: attachmentsLink,
    sender: {
      _id: user._id,
      name: user.name,
      avatar: user.avatar
    }
  };
  const chatMembersConfig = chatMembers.map((member) => ({ _id: member }));
  emitEvent(req, emitConstants.NEW_MESSAGE, chatMembersConfig, {
    chatId: req.params.chatId,
    message: attachmentForRealTime
  });
  const membersNotMe = chatMembersConfig.filter((member) => member._id.toString() !== req.user_id.toString());
  emitEvent(req, emitConstants.ALERT_MESSAGE, membersNotMe, { chatId: req.params.chatId });
  emitEvent(req, emitConstants.LAST_MESSAGE, chatMembersConfig, {
    chatId: req.params.chatId,
    last_message: {
      content: '',
      sender: {
        _id: user._id,
        name: user.name
      }
    }
  });
  //Save to database
  const result = await Message.create({
    sender: req.user_id,
    chat_id: req.params.chatId,
    attachments: attachmentsLink,
    content: ''
  });

  return res.status(200).json({ message: 'Upload file successfully', result });
};

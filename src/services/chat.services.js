import { cloudinaryFolderAttach, MAX_MEMBER_GROUP } from '../constants/var.constants.js';
import Chat from '../models/chat.models.js';
import { ErrorMessage } from '../models/error.models.js';
import Message from '../models/message.models.js';
import User from '../models/user.models.js';
import { onlyItemArray } from '../utils/helper.js';
import { pickInfoObject } from '../utils/lodashUtils.js';
import CommonService from './common.services.js';

class ChatService {
  static async createNewGroupService(body, user_id) {
    const { name, members } = body;
    //filter members
    const membersUnique = members.filter(onlyItemArray);
    const allMembers = [...membersUnique, user_id];
    if (allMembers.length < 3) {
      throw new ErrorMessage({ message: 'Members must be at least 3 members', status: 400 });
    }
    if (allMembers.length > MAX_MEMBER_GROUP) {
      throw new ErrorMessage({ message: 'Members must be less than 100 members', status: 400 });
    }
    await Chat.create({ name, members: allMembers, isGroup: true, creator: user_id });
    return { allMembers, membersUnique };
  }
  static async getMyListService(user_id) {
    const chats = await Chat.find({ members: user_id })
      .populate('members', 'name username avatar')
      .populate('creator', 'name username avatar')
      .lean();

    const chatsConfig = await Promise.all(
      chats.map(async ({ _id, name, creator, members, isGroup }) => {
        //tìm một thanh viên khác trong chat khi không phải là group
        const otherMember = members.find((member) => member._id.toString() !== user_id);
        const lastMessagesOfChat = await Message.findOne({ chat_id: _id })
          .sort({ updatedAt: -1 })
          .populate('sender', 'name');
        const last_message = lastMessagesOfChat
          ? {
              sender: {
                name: lastMessagesOfChat.sender.name,
                _id: lastMessagesOfChat.sender._id
              },
              content: lastMessagesOfChat.content,
              attachment: lastMessagesOfChat.attachments
            }
          : '';
        return {
          id: _id,
          name: isGroup ? name : otherMember.name,
          creator: pickInfoObject(creator, ['name', 'username', 'avatar.url']),
          avatar: isGroup ? members.slice(0, 5).map((member) => member.avatar.url) : otherMember.avatar.url,
          members: members,
          isGroup,
          last_message
        };
      })
    );
    return chatsConfig;
  }
  static async getMyGroupService(user_id) {
    const chatGroups = await Chat.find({ creator: user_id, isGroup: true })
      .populate('members', 'name username avatar')
      .populate('creator', 'name username avatar');
    const chatsConfig = chatGroups.map(({ _id, name, creator, members }) => {
      return {
        id: _id,
        name,
        creator: pickInfoObject(creator, ['name', 'username', 'avatar.url']),
        avatar: members.slice(0, 5).map((member) => member.avatar.url)
      };
    });
    return chatsConfig;
  }
  static async addMemberService(chat, members) {
    //filter members
    const membersUnique = members.filter(onlyItemArray);
    //Lọc những thành viên đã có trong chat
    const membersConfig = membersUnique.filter((member) => !chat.members.includes(member));
    chat.members = [...chat.members, ...membersConfig];
    if (chat.members.length > MAX_MEMBER_GROUP) {
      throw new ErrorMessage({ message: 'Members must be less than 100 members', status: 400 });
    }
    await chat.save();
    return { membersAdded: membersConfig };
  }
  static async removeMemberService(chat, member_id) {
    chat.members = chat.members.filter((member) => member.toString() !== member_id.toString());
    await chat.save();
  }
  static async leaveGroupService(chat, user_id) {
    chat.members = chat.members.filter((member) => member.toString() !== user_id.toString());
    //Kiểm tra user có phải là người tạo group không
    let creatorNew = null;
    if (chat.creator.toString() === user_id) {
      const randomMember = chat.members[Math.floor(Math.random() * chat.members.length)];
      chat.creator = randomMember;
      creatorNew = await User.findById(randomMember, 'name').lean();
    }
    await chat.save();
    return creatorNew;
  }
  static async getChatDetailService(chatId, populate, user_id) {
    if (populate === 'true') {
      const chatDetail = await Chat.findById(chatId).populate('members', '_id name avatar').lean();
      if (!chatDetail.members.some((item) => item._id.toString() === user_id.toString())) {
        throw new ErrorMessage({ message: 'User not permission this chat', status: 403 });
      }
      chatDetail.members = chatDetail.members.map(({ _id, name, avatar }) => ({ _id, name, avatar: avatar.url }));
      return chatDetail;
    }
    const chat = await Chat.findById(chatId).populate('members', '_id name').lean();
    if (!chat.members.some((item) => item._id.toString() === user_id.toString())) {
      throw new ErrorMessage({ message: 'User not permission this chat', status: 403 });
    }
    chat.name = chat.members.find((member) => member._id.toString() !== user_id.toString()).name;
    chat.members = chat.members.map((item) => item._id);
    return chat;
  }
  static async renameGroupService(chatId, user_id, name) {
    const chat = await Chat.findOne({ _id: chatId });
    if (!chat) {
      throw new ErrorMessage({ message: 'Chat not found', status: 404 });
    }
    if (chat.creator.toString() !== user_id.toString()) {
      throw new ErrorMessage({ message: 'User not permission this chat', status: 403 });
    }
    chat.name = name;
    await chat.save();
    return chat;
  }
  static async deleteChatService(chat, user_id) {
    if (chat.isGroup) {
      //Kiểm tra user có phải là người tạo group không
      if (chat.creator.toString() !== user_id.toString())
        throw new ErrorMessage({ message: 'User not permission this chat', status: 403 });
    } else {
      //Kiểm tra user có trong chat không
      if (!chat.members.includes(user_id))
        throw new ErrorMessage({ message: 'User not permission this chat', status: 403 });
    }
    //Tìm message của chat
    const messageWithChat = await Message.find({ chat_id: chat._id });
    const publicIdAttList = [];
    for (let i = 0; i < messageWithChat.length; i++) {
      const attachments = messageWithChat[i].attachments;
      if (attachments.length === 0) continue;
      attachments.forEach((attachment) => {
        publicIdAttList.push({
          public_id: `${cloudinaryFolderAttach}/` + attachment.public_id.toString(),
          type: attachment.file_type
        });
      });
    }
    // const publicIdAttList = messageWithChat.map((message) => {
    //   return message.attachments.map((attachment) => `${cloudinaryFolderAttach}/` + attachment.public_id.toString());
    // });
    console.log('publicIdAttList', publicIdAttList);
    //Xóa message của chat, attachment file trên cloudinary, xóa chat
    await Promise.all([
      CommonService.deleteFileOnCloud(publicIdAttList),
      chat.deleteOne(),
      Message.deleteMany({ chat_id: chat._id })
    ]);
  }
  static async getMessageChatService(chatId, user_id, page, limit) {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new ErrorMessage({ message: 'Chat not found', status: 404 });
    }
    if (!chat.members.includes(user_id)) {
      throw new ErrorMessage({ message: 'User not permission this chat', status: 403 });
    }
    const [messages, totalDocs] = await Promise.all([
      Message.find({ chat_id: chatId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('sender', 'name avatar')
        .lean(),
      Message.countDocuments({ chat_id: chatId })
    ]);
    const totalPages = Math.ceil(totalDocs / limit) || 0;

    return { messages, totalPages };
  }
}
export default ChatService;

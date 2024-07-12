import Chat from '../models/chat.models.js';
import Message from '../models/message.models.js';
import User from '../models/user.models.js';

class AdminService {
  static async getUserData() {
    const userData = await User.aggregate([
      {
        $lookup: {
          from: 'chats',
          localField: '_id',
          foreignField: 'members',
          as: 'chats'
        }
      },
      {
        $addFields: {
          friends: {
            $size: {
              $filter: {
                input: '$chats',
                as: 'chat',
                cond: {
                  $eq: ['$$chat.isGroup', false]
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          groups: {
            $size: {
              $filter: {
                input: '$chats',
                as: 'chat',
                cond: {
                  $eq: ['$$chat.isGroup', true]
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          avatar: '$avatar.url'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          avatar: 1,
          friends: 1,
          groups: 1
        }
      }
    ]);
    return userData;
  }
  static async getGroupData() {
    const groupData = await Chat.aggregate([
      {
        $match: {
          isGroup: true
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'chat_id',
          as: 'messages'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $unwind: {
          path: '$creator'
        }
      },
      {
        $addFields: {
          totalMembers: {
            $size: '$members'
          }
        }
      },
      {
        $addFields: {
          totalMessages: {
            $size: '$messages'
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members',
          foreignField: '_id',
          as: 'members'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          members: 1,
          creator: 1,
          totalMembers: 1,
          totalMessages: 1
        }
      }
    ]);
    return groupData;
  }
  static async getMessageData() {
    const messageData = await Message.find({})
      .populate('sender', 'name avatar.url')
      .populate('chat_id', 'name members isGroup')
      .lean();
    return messageData;
  }
  static async getStats() {
    const [totalUser, totalChat, totalMessage, totalGroupChat] = await Promise.all([
      User.countDocuments(),
      Chat.countDocuments(),
      Message.countDocuments(),
      Chat.countDocuments({ isGroup: true })
    ]);

    const today = new Date();
    let sevenDayLast = new Date();
    sevenDayLast = new Date(sevenDayLast.setDate(sevenDayLast.getDate() - 7));
    const messageInWeek = await Message.aggregate([
      {
        $addFields: {
          dateOnly: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          }
        }
      },
      {
        $match: {
          dateOnly: {
            $gte: sevenDayLast.toISOString().slice(0, 10), //lấy ra ngày tháng năm
            $lt: today.toISOString().slice(0, 10)
          }
        }
      }
    ]);

    const messageAmountInWeek = Array(7).fill(0);
    messageInWeek.forEach((message) => {
      //   const index = Math.floor((today.getTime() - new Date(message.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const index = today.getDate() - new Date(message.createdAt).getDate();
      messageAmountInWeek[7 - index] += 1;
    });
    return {
      totalUser,
      totalChat,
      totalMessage,
      totalGroupChat,
      messageAmountInWeek
    };
  }
}
export default AdminService;

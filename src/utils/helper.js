import { userIoSocket } from '../app.js';
import UserService from '../services/user.services.js';

export const getNameFile = (fileName) => {
  const name = fileName.split('.');
  return name[0];
};
export const getExtensionFile = (fileName) => {
  const name = fileName.split('.');
  return name[name.length - 1];
};

export const onlyItemArray = (item, index, arr) => {
  return arr.indexOf(item) === index;
};
export const generateSocketIdUser = (userIdArr) => {
  console.log('userIoSocket', userIoSocket);
  return userIdArr.map((userId) => userIoSocket.get(userId._id)).filter((item) => !!item);
};
export const getBase64 = (file) => {
  return `data:${file.mimeType};base64,${file.buffer.toString('base64')}`;
};
export function findKeyFromValue(map, value) {
  for (let [key, val] of map.entries()) {
    if (val === value) {
      return key;
    }
  }
  return null; // Trả về null nếu không tìm thấy giá trị tương ứng
}
export const getSocketFriendUser = async (userId) => {
  const userFriends = await UserService.findFriendsId(userId);
  const userFriendsConfig = userFriends.map((id) => ({ _id: id.toString() }));
  const userFriendIoSocket = generateSocketIdUser(userFriendsConfig);
  return userFriendIoSocket;
};

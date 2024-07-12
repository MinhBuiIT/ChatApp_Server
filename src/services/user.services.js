import bcrypt from 'bcrypt';
import fs from 'fs';
import lodash from 'lodash';
import path from 'path';
import sharp from 'sharp';
import Chat from '../models/chat.models.js';
import { ErrorMessage } from '../models/error.models.js';
import User from '../models/user.models.js';
import { uploadFileCloud } from '../utils/cloudinary.js';
import { getNameFile, onlyItemArray } from '../utils/helper.js';

class UserService {
  static async registerService(file, body) {
    const { name, username, password, bio } = body;
    let avatar = null;
    if (file) {
      const pathFile = file.path;
      const fullNameFile = file.path.split('\\').pop();
      const fileName = getNameFile(fullNameFile);
      const newPath = path.resolve('src', 'uploads', 'images', `${fileName}.jpeg`);
      sharp.cache(false);
      const infoImg = await sharp(pathFile).jpeg().toFile(newPath);
      if (fs.existsSync(pathFile)) {
        fs.unlinkSync(pathFile);
      }
      file.path = newPath;
      file.mimetype = `image/${infoImg.format}`;
      file.size = infoImg.size;
      const result = await uploadFileCloud([file]);
      avatar = {
        public_id: result[0].public_id,
        url: result[0].secure_url
      };

      if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath);
      }
    }
    const user = await User.create({ name, username, password, bio, avatar });
    const userConfig = lodash.omit(user, ['password']);
    return userConfig;
  }
  //login service
  static async loginService(body, next) {
    const { username, password } = body;
    const user = await User.findOne({ username: username }).select('+password').lean();
    if (!user) {
      throw new ErrorMessage({ message: 'Invalid Username Or Password', status: 401 });
    }
    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      throw new ErrorMessage({ message: 'Invalid Username Or Password', status: 401 });
    }
    return user;
  }
  //find friends
  static async findFriendsId(user_id) {
    const userFriends = await Chat.find({ members: user_id, isGroup: false }).distinct('members');
    return userFriends;
  }
  static async findFriendsInfo(user_id, select = 'name avatar') {
    const userFriends = await Chat.find({ members: user_id, isGroup: false }).distinct('members');
    const userFriendsConfig = userFriends.map((id) => id.toString()); //chuyển id sang string
    const friendOnly = userFriendsConfig.filter((id) => id !== user_id).filter(onlyItemArray); //loại bỏ id của user và loại bỏ các id trùng
    const friends = await User.find({ _id: { $in: friendOnly } }, select).lean();
    const friendsConfig = friends.map((friend) => {
      return {
        ...friend,
        avatar: friend.avatar.url
      };
    });
    return friendsConfig;
  }
}
export default UserService;

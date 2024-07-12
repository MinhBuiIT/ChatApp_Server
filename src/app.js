import bodyParser from 'body-parser';
import { v2 as cloudinary } from 'cloudinary';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { config } from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import morgan from 'morgan';
import { Server } from 'socket.io';
import emitConstants from './constants/emit.constants.js';
import { corsOptions } from './constants/var.constants.js';
import hanlderError from './middlewares/error.middlewares.js';
import { socketAuthenValidator } from './middlewares/user.middlewares.js';
import Message from './models/message.models.js';
import adminRoute from './routes/admin.routes.js';
import chatRoute from './routes/chat.routes.js';
import requestRoute from './routes/request.routes.js';
import userRoute from './routes/user.routes.js';
import dbService from './services/database.services.js';
import { findKeyFromValue, generateSocketIdUser, getSocketFriendUser } from './utils/helper.js';
import init from './utils/init.js';

config();
const { NEW_MESSAGE, ALERT_MESSAGE, LAST_MESSAGE, START_TYPING, STOP_TYPING, JOIN_ROOM, LOGOUT } = emitConstants;
//Config cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions
});
export const userIoSocket = new Map();
const userOnline = new Set();
//Middleware socket
io.use((socket, next) => {
  cookieParser()(socket.request, socket.request.res, async (err) => await socketAuthenValidator(err, socket, next));
});
app.set('io', io);
io.on('connection', async (socket) => {
  // cookieParser()(socket.request, socket.request.res, () => {});
  const user = socket.request.user;
  userIoSocket.set(user._id.toString(), socket.id);
  userOnline.add(user._id.toString());

  socket.on(JOIN_ROOM, async ({ userId }) => {
    // console.log(userIoSocket, userOnline);
    const userFriendIoSocket = await getSocketFriendUser(userId);
    if (userFriendIoSocket.length > 0)
      io.to(userFriendIoSocket).emit(emitConstants.USER_ONLINE, { onlineUser: Array.from(userOnline) });
  });
  socket.on(START_TYPING, async ({ chatId, members, name }) => {
    const membersNotMe = members.filter((member) => member._id.toString() !== user._id.toString());
    const socketIdUsers = generateSocketIdUser(membersNotMe);
    socket.to(socketIdUsers).emit(START_TYPING, { chatId, name });
  });
  socket.on(STOP_TYPING, async ({ chatId, members, name }) => {
    const membersNotMe = members.filter((member) => member._id.toString() !== user._id.toString());
    const socketIdUsers = generateSocketIdUser(membersNotMe);
    socket.to(socketIdUsers).emit(STOP_TYPING, { chatId, name });
  });
  socket.on(NEW_MESSAGE, async ({ chatId, message, members }) => {
    const nanoid = (await import('nanoid')).nanoid;
    const membersNotMe = members.filter((member) => member._id.toString() !== user._id.toString());
    const messageForRealTime = {
      _id: nanoid(),
      chat_id: chatId,
      content: message,
      createdAt: new Date().toISOString(),
      sender: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar
      }
    };
    const messageForDb = { sender: user._id, content: message, chat_id: chatId };
    const socketIdUsers = generateSocketIdUser(members);
    const socketIdUsersNotMe = generateSocketIdUser(membersNotMe);
    io.to(socketIdUsers).emit(NEW_MESSAGE, { chatId, message: messageForRealTime });
    io.to(socketIdUsersNotMe).emit(ALERT_MESSAGE, { chatId });
    io.to(socketIdUsersNotMe).emit(LAST_MESSAGE, {
      chatId,
      last_message: {
        content: message,
        sender: {
          _id: user._id,
          name: user.name
        }
      }
    });
    await Message.create(messageForDb);
  });
  socket.on(LOGOUT, async ({ userId }) => {
    userIoSocket.delete(userId);
    userOnline.delete(userId);
    const userFriendIoSocket = await getSocketFriendUser(userId);
    if (userFriendIoSocket.length > 0)
      io.to(userFriendIoSocket).emit(emitConstants.USER_OFFLINE, {
        offlineUser: userId
      });
    socket.disconnect();
  });
  socket.on('disconnect', async () => {
    userIoSocket.delete(user._id);
    const userId = findKeyFromValue(userIoSocket, socket.id);
    userOnline.delete(userId);
    const userFriendIoSocket = await getSocketFriendUser(userId);
    if (userFriendIoSocket.length > 0)
      io.to(userFriendIoSocket).emit(emitConstants.USER_OFFLINE, {
        offlineUser: userId
      });
    console.log(`user disconnected ${socket.id}`);
  });
});
//Khởi tạo folder
init();
//Middleware init
app.use(express.json());
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(compression());
app.use(helmet());
app.use(cookieParser());
//Kết nối với database
dbService.connect();

app.use('/api/v1/user', userRoute);
app.use('/api/v1/chat', chatRoute);
app.use('/api/v1/request', requestRoute);
app.use('/api/v1/admin', adminRoute);
app.use(hanlderError);

//Fake data
// fakeUser(15);
// fakeSingleChat(10);
// fakeGroupChat(10);
// fakeMessageInChat('667aed0ba2038ab605db8980', 30);
export default httpServer;

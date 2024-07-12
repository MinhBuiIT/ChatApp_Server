import { generateSocketIdUser } from './helper.js';

export const emitEvent = (req, message, users, data = '') => {
  const io = req.app.get('io');
  const userIoSocket = generateSocketIdUser(users);
  console.log('generateSocketIdUser', userIoSocket);
  if (!userIoSocket || userIoSocket.length === 0) return;
  io.to(userIoSocket).emit(message, data);
};

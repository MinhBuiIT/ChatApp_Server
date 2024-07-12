import { faker } from '@faker-js/faker';
import Chat from '../models/chat.models.js';
import Message from '../models/message.models.js';

export const fakeMessageInChat = async (chatId, numMessage) => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    return;
  }
  const members = chat.members;
  for (let i = 0; i < numMessage; i++) {
    const sender = members[Math.floor(Math.random() * members.length)];
    await Message.create({
      chat_id: chatId,
      sender,
      content: faker.lorem.sentence({ min: 5, max: 10 }),
      attachments: []
    });
  }
};

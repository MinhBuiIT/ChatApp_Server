import { faker } from '@faker-js/faker';
import Chat from '../models/chat.models.js';
import User from '../models/user.models.js';

export const fakeSingleChat = async (numChats) => {
  const users = await User.find();
  const usersId = users.map((user) => user._id);
  const memberAdded = [];
  for (let i = 0; i < numChats; i++) {
    let index1;
    let index2;
    //kiểm tra member không trùng
    let isStop = false;
    while (!isStop) {
      index1 = Math.floor(Math.random() * usersId.length);
      index2 = Math.floor(Math.random() * usersId.length);
      if (index1 === index2) continue;
      if (memberAdded.length === 0) isStop = true;
      else {
        isStop = memberAdded.every((item) => {
          return !(item.includes(usersId[index1]) && item.includes(usersId[index2]));
        });
      }
    }
    const members = [usersId[index1], usersId[index2]];
    memberAdded.push(members);
    await Chat.create({
      creator: null,
      isGroup: false,
      name: '',
      members: members
    });
  }
};
export const fakeGroupChat = async (numChats) => {
  const users = await User.find();
  const usersId = users.map((user) => user._id);
  for (let i = 0; i < numChats; i++) {
    const members = [];
    const numMembers = Math.floor(Math.random() * 5) + 3;
    let memberAddedIndex = [];
    let isStop = false;
    for (let j = 0; j < numMembers; j++) {
      //kiểm tra member không trùng
      let index;
      while (!isStop) {
        index = Math.floor(Math.random() * usersId.length);
        if (!memberAddedIndex.includes(index)) isStop = true;
      }
      isStop = false;
      members.push(usersId[index]);
      memberAddedIndex.push(index);
    }
    await Chat.create({
      creator: members[0],
      isGroup: true,
      name: faker.lorem.words(3),
      members: members
    });
  }
};

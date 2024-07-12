import { faker } from '@faker-js/faker';
import User from '../models/user.models.js';

export const fakeUser = (numUser) => {
  const users = [];
  for (let i = 0; i < numUser; i++) {
    users.push(
      User.create({
        name: faker.person.firstName() + ' ' + faker.person.lastName(),
        username: faker.internet.userName(),
        bio: faker.person.bio(),
        avatar: {
          public_id: faker.database.mongodbObjectId(),
          url: faker.image.avatar()
        },
        password: 'ak5crmVF*'
      })
    );
  }
  Promise.all(users);
  console.log('Fake users created successfully!');
};

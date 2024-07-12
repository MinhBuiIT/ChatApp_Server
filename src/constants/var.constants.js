import { config } from 'dotenv';

config();
export const MAX_MEMBER_GROUP = 100;
export const corsOptions = {
  origin: ['http://localhost:5173', process.env.CLIENT_URL],
  credentials: true
};
export const cloudinaryFolderAttach = 'attachmentsFile';

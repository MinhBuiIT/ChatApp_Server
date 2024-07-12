import mongoose, { Schema, Types } from 'mongoose';

const COLLECTION_NAME = 'chats';
const DOCUMENT_NAME = 'Chat';

const chat = new Schema(
  {
    name: {
      type: String,
      trim: true,
      index: true
    },
    creator: {
      type: Types.ObjectId,
      ref: 'User'
    },
    members: [
      {
        type: Types.ObjectId,
        ref: 'User'
      }
    ],
    isGroup: {
      type: Boolean,
      required: true
    }
  },
  { timestamps: true, collection: COLLECTION_NAME }
);
const Chat = mongoose.models.Chat || mongoose.model(DOCUMENT_NAME, chat);
export default Chat;

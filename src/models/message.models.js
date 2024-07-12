import mongoose, { Types } from 'mongoose'; // Erase if already required

const DOCUMENT_NAME = 'Message';
const COLLECTION_NAME = 'messages';
// Declare the Schema of the Mongo model
var messageSchema = new mongoose.Schema(
  {
    sender: {
      type: Types.ObjectId,
      required: true,
      index: true,
      ref: 'User'
    },
    chat_id: {
      type: Types.ObjectId,
      required: true,
      ref: 'Chat',
      index: true
    },
    content: {
      type: String,
      default: ''
    },
    attachments: [
      {
        public_id: {
          type: String
        },
        url: {
          type: String
        },
        file_name: {
          type: String,
          optional: true
        },
        file_type: {
          type: String,
          enum: ['image', 'video', 'file', 'audio']
        }
      }
    ]
  },
  { timestamps: true, collection: COLLECTION_NAME }
);

//Export the model
const Message = mongoose.model(DOCUMENT_NAME, messageSchema);
export default Message;

import mongoose from 'mongoose'; // Erase if already required

const DOCUMENT_NAME = 'Request';
const COLLECTION_NAME = 'requests';
// Declare the Schema of the Mongo model
var requestSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    sender: {
      type: mongoose.Types.ObjectId,
      required: true,
      index: true,
      ref: 'User'
    },
    receiver: {
      type: mongoose.Types.ObjectId,
      required: true,
      index: true,
      ref: 'User'
    }
  },
  { timestamps: true, collection: COLLECTION_NAME }
);

//Export the model
const Request = mongoose.model(DOCUMENT_NAME, requestSchema);
export default Request;

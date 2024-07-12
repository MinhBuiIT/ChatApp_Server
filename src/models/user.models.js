import bcrypt from 'bcrypt';
import mongoose, { Schema } from 'mongoose';

const COLLECTION_NAME = 'users';
const DOCUMENT_NAME = 'User';
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32
    },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    bio: {
      type: String,
      required: true
    },
    avatar: {
      public_id: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      }
    }
  },
  { timestamps: true, collection: COLLECTION_NAME }
);
userSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    this.password = bcrypt.hashSync(this.password, 10);
  }
  next();
});
const User = mongoose.models.User || mongoose.model(DOCUMENT_NAME, userSchema);
export default User;

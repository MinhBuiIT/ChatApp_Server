import mongoose from 'mongoose';
import config from '../utils/config.js';

config();
class MongdoDB {
  connect() {
    return mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
  }
}
class DatabaseService {
  constructor(db) {
    if (!!DatabaseService.instance) {
      return DatabaseService.instance;
    }
    DatabaseService.instance = this;
    this.db = db;
  }

  async connect() {
    try {
      await this.db.connect();
      console.log('Connected to MongoDB Successfully');
    } catch (error) {
      console.log('Connect to MongoDB unsuccessfully', error);
    }
  }
}
const mongodb = new MongdoDB();
const dbService = new DatabaseService(mongodb);
export default dbService;

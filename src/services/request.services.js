import Request from '../models/request.models.js';

class RequestService {
  static async checkRequestExistService(sender_id, receiver_id) {
    const requestExist = await Request.findOne({
      $or: [
        { sender: sender_id, receiver: receiver_id },
        { sender: receiver_id, receiver: sender_id }
      ]
    }).lean();
    return requestExist;
  }
  static async creatRequestService(sender_id, receiver_id) {
    await Request.create({ sender: sender_id, receiver: receiver_id });
  }
  static async findSenderRequestService(_id) {
    const senderRequest = await Request.find({ sender: _id }).lean();
    return senderRequest;
  }
}
export default RequestService;

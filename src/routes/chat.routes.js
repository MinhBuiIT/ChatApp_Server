import { Router } from 'express';
import {
  addMemberController,
  attachmentController,
  createNewGroupController,
  deleteChatController,
  getChatDetailController,
  getMessageChatController,
  getMyGroupController,
  getMyListController,
  leaveGroupController,
  removeMemberController,
  renameGroupController
} from '../controllers/chat.controller.js';
import {
  addGroupValidator,
  addMemberGroupValidator,
  leaveGroupValidator,
  removeMemberGroupValidator
} from '../middlewares/chat.middlewares.js';
import { authenticatedValidator } from '../middlewares/user.middlewares.js';
import { uploadMulterArr } from '../utils/multer.js';
import { wrapperError } from '../utils/wrapperError.js';

const chatRoute = Router();
chatRoute.post(
  '/attachment/:chatId',
  uploadMulterArr('attach', 5),
  authenticatedValidator,
  wrapperError(attachmentController)
);

chatRoute.post('/new-group', authenticatedValidator, addGroupValidator, wrapperError(createNewGroupController));
chatRoute.get('/my-list', authenticatedValidator, wrapperError(getMyListController));
chatRoute.get('/my-group', authenticatedValidator, wrapperError(getMyGroupController));
chatRoute.put('/add-member', authenticatedValidator, addMemberGroupValidator, wrapperError(addMemberController));
chatRoute.put(
  '/remove-member',
  authenticatedValidator,
  removeMemberGroupValidator,
  wrapperError(removeMemberController)
);
chatRoute.delete('/leave/:chat_id', authenticatedValidator, leaveGroupValidator, wrapperError(leaveGroupController));
//Get Message Chat by chatid
//Validator Pagination
chatRoute.get('/:id/messages', authenticatedValidator, wrapperError(getMessageChatController));
//Get Details Chat by chatid, rename, delete chat
chatRoute.get('/:id', authenticatedValidator, wrapperError(getChatDetailController));
chatRoute.put('/:id', authenticatedValidator, wrapperError(renameGroupController));
chatRoute.delete('/:id', authenticatedValidator, wrapperError(deleteChatController));
export default chatRoute;

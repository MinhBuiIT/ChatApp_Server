import multer from 'multer';
import path from 'path';
import { getExtensionFile, getNameFile } from './helper.js';

const storageImg = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve('src', 'uploads/images'));
  },
  filename: async (req, file, cb) => {
    const nanoid = (await import('nanoid')).nanoid;
    const id = nanoid(10);
    const nameFile = getNameFile(file.originalname);
    const ext = getExtensionFile(file.originalname);
    cb(null, `${nameFile}-${id}.${ext}`);
  }
});
const uploadRegisterConfig = multer({
  storage: storageImg,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (file.fieldname !== 'avatar') {
      return callback(new Error('Fieldname is not avatar'));
    }
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
      return callback(new Error('Only images are allowed'));
    }
    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
  //Viết filter file
});
const uploadMulter = (multer, fieldName) => multer.single(fieldName);

export const uploadMulterArr = (name, maxFile) => multer().array(name, maxFile);

export const uploadMulterRegister = uploadMulter(uploadRegisterConfig, 'avatar');

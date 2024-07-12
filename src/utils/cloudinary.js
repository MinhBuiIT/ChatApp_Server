import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { cloudinaryFolderAttach } from '../constants/var.constants.js';
import { getExtensionFile, getNameFile } from './helper.js';
export const uploadFileCloud = async (files = []) => {
  const filesUploads = await Promise.all(
    files.map(async (file) => {
      const nanoid = (await import('nanoid')).nanoid;
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: 'auto',
        public_id: nanoid()
      });
      return result;
    })
  );
  return filesUploads;
};
export const uploadFileCloudBuffer = async (file) => {
  const isFileRaw = file.mimetype.includes('application/');
  const nanoid = (await import('nanoid')).nanoid;
  let cld_upload_stream = new Promise((resolve, reject) => {
    const customFileName = isFileRaw
      ? `${getNameFile(file.originalname)}_${nanoid(5)}.${getExtensionFile(file.originalname)}`
      : nanoid();
    const uploadStrFile = cloudinary.uploader.upload_stream(
      { resource_type: isFileRaw ? 'raw' : 'auto', folder: cloudinaryFolderAttach, public_id: customFileName },
      (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(uploadStrFile);
  });

  return cld_upload_stream;
};

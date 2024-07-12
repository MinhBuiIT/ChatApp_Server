import fs from 'fs';
import path from 'path';

const init = () => {
  const src = path.resolve('src');
  const pathImagesFolder = path.resolve(src, 'uploads/images');

  if (!fs.existsSync(pathImagesFolder)) {
    fs.mkdirSync(pathImagesFolder, { recursive: true });
  }
};
export default init;

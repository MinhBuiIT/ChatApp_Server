import lodash from 'lodash';
import { ErrorMessage } from '../models/error.models.js';
const hanlderError = (err, req, res, next) => {
  if (err) {
    const status = err.status || 500;
    const message = err._message || err.message || err.name || 'Internal Server Error';
    if (err instanceof ErrorMessage) {
      return res.status(status).json({ message: message });
    }
    const errConfig = lodash.omit(err, ['_message', 'name', 'message', 'status']);
    return res.status(status).json({ message: message, result: errConfig });
  }
  return res.status(500).json({ message: 'Internal Server Error' });
};
export default hanlderError;

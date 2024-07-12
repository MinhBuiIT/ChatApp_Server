import jwt from 'jsonwebtoken';
export const signToken = (payload, secret, options = {}) => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, options, (err, token) => {
      if (err) return reject(err);
      return resolve(token);
    });
  });
};
export const verifyToken = (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, function (err, decoded) {
      if (err) {
        return reject(err);
      }
      return resolve(decoded);
    });
  });
};

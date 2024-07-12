import { validationResult } from 'express-validator';
import { ErrorEntity, ErrorMessage } from '../models/error.models.js';

const validate = (validations) => {
  return async (req, res, next) => {
    await validations.run(req);
    const result = validationResult(req);
    if (result.isEmpty()) {
      return next();
    }
    const errorEntity = new ErrorEntity({ errors: {} });
    const errValidation = result.mapped();
    for (const key in errValidation) {
      const { msg } = errValidation[key];
      if (msg instanceof ErrorMessage) {
        return next(msg);
      }
      errorEntity.errors[key] = errValidation[key];
    }
    next(errorEntity);
  };
};
export default validate;

export class ErrorMessage {
  constructor({ message, status }) {
    this.message = message;
    this.status = status;
  }
}

export class ErrorEntity {
  constructor({ errors }) {
    this.errors = errors;
    this.message = 'Validation Error';
    this.status = 422;
  }
}

import { HttpException, HttpStatus } from '@nestjs/common';

const userNotFoundMessage = 'User not found';
export class UserNotFoundException extends HttpException {
  constructor() {
    super(userNotFoundMessage, HttpStatus.NOT_FOUND);
  }
}

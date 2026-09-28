import { HttpException, HttpStatus } from '@nestjs/common';

const merchantNotFoundMessage = 'Merchant not found';
export class MerchantNotFoundException extends HttpException {
  constructor() {
    super(merchantNotFoundMessage, HttpStatus.NOT_FOUND);
  }
}

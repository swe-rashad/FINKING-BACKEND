import { ConflictException, NotFoundException } from '@nestjs/common';

export class MerchantNotFoundException extends NotFoundException {
  constructor(message = 'Merchant not found') {
    super(message);
  }
}

export class MerchantNameAlreadyExistsException extends ConflictException {
  constructor(message = 'Merchant with this name already exists') {
    super(message);
  }
}

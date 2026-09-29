import { UnauthorizedException } from '@nestjs/common';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor(message = 'Invalid credentials') {
    super(message);
  }
}

export class InvalidTokenTypeException extends UnauthorizedException {
  constructor(message = 'Invalid token type') {
    super(message);
  }
}

export class TokenRevokedException extends UnauthorizedException {
  constructor(message = 'Refresh token has been revoked') {
    super(message);
  }
}

export class AuthUserNotFoundException extends UnauthorizedException {
  constructor(message = 'User not found') {
    super(message);
  }
}

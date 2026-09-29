import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor(message = 'User not found') {
    super(message);
  }
}

export class CannotBlockAdminException extends ForbiddenException {
  constructor(message = 'Cannot block an admin user') {
    super(message);
  }
}

export class UserAlreadyBlockedException extends BadRequestException {
  constructor(message = 'User is already blocked') {
    super(message);
  }
}

export class UserBlockedException extends ForbiddenException {
  constructor(message = 'Your account has been blocked') {
    super(message);
  }
}

export class PasswordChangeRequiredException extends ForbiddenException {
  constructor(message = 'You must change your password before continuing') {
    super(message);
  }
}

export class AdminRoleAssignmentException extends BadRequestException {
  constructor(message = 'Cannot change role to admin') {
    super(message);
  }
}

export class UserEmailAlreadyExistsException extends ConflictException {
  constructor(message = 'User with this email already exists') {
    super(message);
  }
}

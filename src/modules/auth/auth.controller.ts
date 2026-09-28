import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import type { JwtPayload } from './types/auth.type';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtRefreshGuard } from '@/common/guards/jwt-refresh.guard';

@ApiTags('Auth')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/sign-in')
  signIn(@Body() payload: SignInDto) {
    return this.authService.signIn(payload);
  }

  @Public()
  @Post('/sign-up')
  signUp(@Body() payload: SignUpDto) {
    return this.authService.signUp(payload);
  }

  @Public()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtRefreshGuard)
  @Get('/refresh-token')
  getRefreshToken(@CurrentUser() user: JwtPayload) {
    return this.authService.refreshToken(user);
  }
}

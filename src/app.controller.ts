import {
  Body,
  Catch,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Error } from 'mongoose';
import { AuthService } from './auth/auth.service';
import { JwtAuthGaurd } from './auth/jwt-auth.gaurd';
import { LocalAuthGaurd } from './auth/local-auth.gaurd';
import { CreateUserDto } from './user/dto/create-user.dto';
import { UserService } from './user/user.service';

@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}
}

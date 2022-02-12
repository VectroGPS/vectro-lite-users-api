import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LocalAuthGaurd } from '../auth/local-auth.gaurd';
import { JwtAuthGaurd } from 'src/auth/jwt-auth.gaurd';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGaurd)
  @Patch()
  update(@Request() req, @Body() createUserDto: Partial<CreateUserDto>) {
    console.log(createUserDto, req.user);
    return this.userService.update(req.user, createUserDto);
  }
}

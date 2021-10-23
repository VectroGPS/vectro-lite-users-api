import { Body, Catch, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { Error } from 'mongoose';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { JwtAuthGaurd } from './auth/jwt-auth.gaurd';
import { LocalAuthGaurd } from './auth/local-auth.gaurd';
import { CreateUserDto } from './user/dto/create-user.dto';
import { UserService } from './user/user.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly authService: AuthService, private readonly userService: UserService) {}

  @Get()
  hello(): any{
    return this.appService.getHello()
  }

  @Post('signup')
  async create(@Body() createUserDto: CreateUserDto, @Request() req) {
    const user = await this.userService.create(createUserDto);
    return {
      "message": "signup successful",
      "user": user
    }
  }
  
  @UseGuards(LocalAuthGaurd)
  @Post('login')
  login(@Request() req): any {
    return this.authService.login(req.user)
  } 

  @UseGuards(JwtAuthGaurd)
  @Get('protected')
  getHello(@Request() req): string { 
    return req.user;
  }
}

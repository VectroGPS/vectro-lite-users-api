import { Injectable } from '@nestjs/common';
const bcrypt = require('bcrypt');
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwtService: JwtService){}

  async validateUser(username: string, password: string): Promise<any>{
    const user = await this.userService.findOneWithUsername(username);

    if(user && await bcrypt.compare(password, user.password)){
      const {password, ...rest} = user

      return rest;
    }

    return null;
  }

  async login(user: any){
    const payload = {sub: user._id.toString()};

    return {
      access_token: this.jwtService.sign(payload)
    }
  }
}

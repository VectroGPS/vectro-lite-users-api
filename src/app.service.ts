import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return "Hello World!\n Please Follow \"readme.md\" instructions to proceed.\n W";
  }
}

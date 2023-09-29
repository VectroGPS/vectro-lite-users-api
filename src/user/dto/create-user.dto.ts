import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRoles } from '../interfaces/roles';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(UserRoles)
  role: UserRoles;

  @IsString()
  parent: string;

  @IsObject()
  config: any;

  @IsObject()
  customProperties: {
    [key: string]: any;
  };
}

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
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Fullname is required' })
  fullname: string;

  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @Transform(({ value }) => value.trim())
  username: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
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

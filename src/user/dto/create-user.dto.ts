import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsString()
  username: string;
  
  @IsEmail()
  email: string;
  
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
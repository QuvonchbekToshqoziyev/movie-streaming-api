import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'email kiriting' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'password kiriting' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  password!: string;
}

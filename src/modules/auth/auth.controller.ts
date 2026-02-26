import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user', description: 'Access: PUBLIC' })
  register(@Body() payload: CreateUserDto) {
    return this.authService.register(payload);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user', description: 'Access: PUBLIC' })
  login(
    @Body() payload: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(payload, response);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user', description: 'Access: PUBLIC' })
  logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }
}

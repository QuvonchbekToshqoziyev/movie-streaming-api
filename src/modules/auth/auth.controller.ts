import {
  Body,
  Controller,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateAdminDto } from '../admins/dto/create-admin.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

const AVATAR_DIR = join(process.cwd(), 'uploads', 'avatars');
if (!existsSync(AVATAR_DIR)) mkdirSync(AVATAR_DIR, { recursive: true });

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `avatar-${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
          return cb(new Error('Only jpeg, png, webp images are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'username', 'password'],
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        username: { type: 'string', example: 'john_doe' },
        password: { type: 'string', example: 'password123' },
        avatar: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Register a new profile (user) with avatar', description: 'Access: PUBLIC' })
  register(
    @Body() payload: CreateUserDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    return this.authService.register(payload, avatar);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login as profile (user)', description: 'Access: PUBLIC' })
  login(
    @Body() payload: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.profileLogin(payload, response);
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Login as admin / superadmin', description: 'Access: PUBLIC' })
  adminLogin(
    @Body() payload: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.adminLogin(payload, response);
  }

  @Post('admin/register')
  @ApiOperation({ summary: 'Register a new admin', description: 'Access: PUBLIC' })
  adminRegister(@Body() payload: CreateAdminDto) {
    return this.authService.adminRegister(payload);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user', description: 'Access: PUBLIC' })
  logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }
}

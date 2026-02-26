import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

const UPLOAD_ROOT = join(process.cwd(), 'uploads');
const POSTER_DIR = join(UPLOAD_ROOT, 'posters');
const VIDEO_DIR = join(UPLOAD_ROOT, 'videos');

[UPLOAD_ROOT, POSTER_DIR, VIDEO_DIR].forEach((dir) => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (_req, file, cb) => {
          const isVideo = file.mimetype.startsWith('video/');
          cb(null, isVideo ? VIDEO_DIR : POSTER_DIR);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 4 * 1024 * 1024 * 1024, // 4GB max for videos
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}

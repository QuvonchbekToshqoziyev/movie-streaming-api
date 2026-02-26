import { Module } from '@nestjs/common';
import { MoviesController, AdminMoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { VideoProcessorService } from './video-processor.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MoviesController, AdminMoviesController],
  providers: [MoviesService, VideoProcessorService],
  exports: [MoviesService, VideoProcessorService],
})
export class MoviesModule { }

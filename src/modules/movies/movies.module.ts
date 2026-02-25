import { Module } from '@nestjs/common';
import { MoviesController, AdminMoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MoviesController, AdminMoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}

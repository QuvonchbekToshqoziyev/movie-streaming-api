import { Module } from '@nestjs/common';
import { PlaylistController } from './playlists.controller';
import { PlaylistService } from './playlists.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PlaylistController],
  providers: [PlaylistService],
})
export class PlaylistsModule {}

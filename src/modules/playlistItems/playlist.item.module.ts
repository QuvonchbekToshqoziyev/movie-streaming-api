import { Module } from '@nestjs/common';
import { PlaylistItemController } from './playlist-item.controller';
import { PlaylistItemService } from './playlist-item.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PlaylistItemController],
  providers: [PlaylistItemService],
})
export class PlaylistItemModule {}

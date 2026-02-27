import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlaylistItemService } from './playlist-item.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AddPlaylistItemDto } from './dto/playlist-item.dto';

@ApiTags('Playlist Items')
@Controller('playlists/:playlistId/items')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
@ApiBearerAuth('access-token')
export class PlaylistItemController {
  constructor(private readonly playlistItemService: PlaylistItemService) {}

  @Post()
  @ApiOperation({
    summary: 'Playlistga kino qo\'shish',
    description: 'Access: PROFILE',
  })
  add(
    @CurrentUser('sub') profileId: number,
    @Param('playlistId', ParseIntPipe) playlistId: number,
    @Body() dto: AddPlaylistItemDto,
  ) {
    return this.playlistItemService.add(profileId, playlistId, dto);
  }

  @Delete('movies/:movieId')
  @ApiOperation({
    summary: 'Playlistdan kinoni movie ID orqali o\'chirish',
    description: 'Access: PROFILE',
  })
  removeByMovieId(
    @CurrentUser('sub') profileId: number,
    @Param('playlistId', ParseIntPipe) playlistId: number,
    @Param('movieId', ParseIntPipe) movieId: number,
  ) {
    return this.playlistItemService.removeByMovieId(
      profileId,
      playlistId,
      movieId,
    );
  }

  @Delete(':itemId')
  @ApiOperation({
    summary: 'Playlistdan kinoni item ID orqali o\'chirish',
    description: 'Access: PROFILE',
  })
  remove(
    @CurrentUser('sub') profileId: number,
    @Param('playlistId', ParseIntPipe) playlistId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.playlistItemService.remove(profileId, playlistId, itemId);
  }
}
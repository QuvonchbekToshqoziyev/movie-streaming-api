import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlaylistService } from './playlists.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePlaylistDto, UpdatePlaylistDto } from './dto/create-playlist.dto';

@ApiTags('Playlist')
@Controller('playlists')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
@ApiBearerAuth('access-token')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get()
  @ApiOperation({
    summary: 'Barcha playlistlar',
    description: 'Access: PROFILE',
  })
  findAll(@CurrentUser('sub') profileId: number) {
    return this.playlistService.findAll(profileId);
  }

  @Get(':playlistId')
  @ApiOperation({
    summary: 'Playlist va uning kinolari',
    description: 'Access: PROFILE',
  })
  findOne(
    @CurrentUser('sub') profileId: number,
    @Param('playlistId', ParseIntPipe) playlistId: number,
  ) {
    return this.playlistService.findOne(profileId, playlistId);
  }

  @Post()
  @ApiOperation({
    summary: 'Yangi playlist yaratish',
    description: 'Access: PROFILE',
  })
  create(
    @CurrentUser('sub') profileId: number,
    @Body() dto: CreatePlaylistDto,
  ) {
    return this.playlistService.create(profileId, dto);
  }

  @Put(':playlistId')
  @ApiOperation({
    summary: 'Playlist nomini yangilash',
    description: 'Access: PROFILE',
  })
  update(
    @CurrentUser('sub') profileId: number,
    @Param('playlistId', ParseIntPipe) playlistId: number,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlistService.update(profileId, playlistId, dto);
  }

  @Delete(':playlistId')
  @ApiOperation({
    summary: 'Playlistni o\'chirish',
    description: 'Access: PROFILE',
  })
  remove(
    @CurrentUser('sub') profileId: number,
    @Param('playlistId', ParseIntPipe) playlistId: number,
  ) {
    return this.playlistService.remove(profileId, playlistId);
  }
}
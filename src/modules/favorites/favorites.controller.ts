import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class AddFavoriteDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  movie_id!: number;
}

@ApiTags('Favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Sevimli kinolar ro\'yxati' })
  findAll(@CurrentUser('sub') profileId: number) {
    return this.favoritesService.findAll(profileId);
  }

  @Post()
  @ApiOperation({ summary: 'Kinoni sevimlilarga qo\'shish' })
  add(@CurrentUser('sub') profileId: number, @Body() dto: AddFavoriteDto) {
    return this.favoritesService.add(profileId, dto.movie_id);
  }

  @Delete(':movieId')
  @ApiOperation({ summary: 'Kinoni sevimlilardan o\'chirish' })
  remove(@CurrentUser('sub') profileId: number, @Param('movieId', ParseIntPipe) movieId: number) {
    return this.favoritesService.remove(profileId, movieId);
  }
}

import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { QueryMovieDto } from './dto/query-movie.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateMovieFileDto } from './dto/create-movie-file.dto';
import { OptionalJwtGuard } from '../../common/guards/optional-jwt.guard';

// ── Public Movie Endpoints ──
@ApiTags('Movies')
@Controller('movies')
@UseGuards(OptionalJwtGuard)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) { }

  @Get()
  @ApiOperation({ summary: 'Barcha kinolar (pagination, search, filter)' })
  findAll(@Query() query: QueryMovieDto, @CurrentUser('sub') profileId: number | null) {
    return this.moviesService.findAll(query, profileId);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Kinoni slug bo\'yicha olish' })
  findBySlug(@Param('slug') slug: string, @CurrentUser('sub') profileId: number | null) {
    return this.moviesService.findBySlug(slug, profileId);
  }
}

// ── Admin Movie Endpoints ──
@ApiTags('Admin Movies')
@Controller('admin/movies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
@ApiBearerAuth('access-token')
export class AdminMoviesController {
  constructor(private readonly moviesService: MoviesService) { }

  @Get()
  @ApiOperation({ summary: 'Admin: barcha kinolar ro\'yxati' })
  findAll() {
    return this.moviesService.adminFindAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: kinoni ID bo\'yicha olish' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: yangi kino qo\'shish' })
  create(@Body() dto: CreateMovieDto, @CurrentUser('sub') userId: number) {
    return this.moviesService.create(dto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: kinoni yangilash' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMovieDto) {
    return this.moviesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: kinoni o\'chirish' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.remove(id);
  }

  @Post(':id/files')
  @ApiOperation({ summary: 'Admin: kino fayli qo\'shish' })
  addFile(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateMovieFileDto) {
    return this.moviesService.addMovieFile(id, dto);
  }
}

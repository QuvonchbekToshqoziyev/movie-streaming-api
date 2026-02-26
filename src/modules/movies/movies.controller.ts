import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

@ApiTags('Movies')
@Controller('movies')
@UseGuards(OptionalJwtGuard)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) { }

  @Get()
  @ApiOperation({
    summary: 'Barcha kinolar (pagination, search, filter)',
    description: 'Access: PUBLIC',
  })
  findAll(
    @Query() query: QueryMovieDto,
    @CurrentUser('sub') profileId: number | null,
  ) {
    return this.moviesService.findAll(query, profileId);
  }

  @Get(':slug')
  @ApiOperation({
    summary: "Kinoni slug bo'yicha olish",
    description: 'Access: PUBLIC',
  })
  findBySlug(
    @Param('slug') slug: string,
    @CurrentUser('sub') profileId: number | null,
  ) {
    return this.moviesService.findBySlug(slug, profileId);
  }
}

@ApiTags('Admin Movies')
@Controller('admin/movies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
@ApiBearerAuth('access-token')
export class AdminMoviesController {
  constructor(private readonly moviesService: MoviesService) { }

  @Get()
  @ApiOperation({
    summary: "Admin: barcha kinolar ro'yxati",
    description: 'Access: ADMIN, SUPERADMIN',
  })
  findAll() {
    return this.moviesService.adminFindAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: "Admin: kinoni ID bo'yicha olish",
    description: 'Access: ADMIN, SUPERADMIN',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: "Admin: yangi kino qo'shish",
    description: 'Access: ADMIN, SUPERADMIN',
  })
  create(@Body() dto: CreateMovieDto, @CurrentUser('sub') userId: number) {
    return this.moviesService.create(dto, userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Admin: kinoni yangilash',
    description: 'Access: ADMIN, SUPERADMIN',
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMovieDto) {
    return this.moviesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: "Admin: kinoni o'chirish",
    description: 'Access: ADMIN, SUPERADMIN',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.remove(id);
  }

  @Post(':id/files')
  @ApiOperation({
    summary: "Admin: kino fayli qo'shish",
    description: 'Access: ADMIN, SUPERADMIN',
  })
  addFile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMovieFileDto,
  ) {
    return this.moviesService.addMovieFile(id, dto);
  }

  @Post(':id/upload')
  @ApiOperation({
    summary: 'Admin: kino videosini yuklash va sifatlarga boʻlish',
    description: 'Access: ADMIN, SUPERADMIN',
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadVideo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.moviesService.processMovieUpload(id, file);
  }
}

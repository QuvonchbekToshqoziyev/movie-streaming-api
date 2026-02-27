import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
import { MovieQuality, MovieType } from '@prisma/client';




@ApiTags('Movies')
@Controller('movies')
@UseGuards(OptionalJwtGuard)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get('files')
  @ApiOperation({ summary: 'Get movie file by movieId and quality', description: 'Access: PUBLIC (subscription checked). Use AUTO for highest available quality.' })
  @ApiQuery({ name: 'movieId', required: true, type: Number, example: 1 })
  @ApiQuery({ name: 'quality', required: true, enum: ['AUTO', 'P240', 'P360', 'P480', 'P720', 'P1080', 'P4K'] })
  getMovieFile(
    @Query('movieId', ParseIntPipe) movieId: number,
    @Query('quality') quality: string,
    @CurrentUser('sub') profileId: number | null,
    @CurrentUser('role') role: string | null,
  ) {
    const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';
    return this.moviesService.getMovieFile(movieId, quality, profileId, isAdmin);
  }
  
  @Get()
  @ApiOperation({ summary: 'Kinolar (pagination, search, filter, slug)', description: 'Access: PUBLIC. If slug is provided, returns single movie detail.' })
  findAll(
    @Query() query: QueryMovieDto,
    @CurrentUser('sub') profileId: number | null,
    @CurrentUser('role') role: string | null,
  ) {
    const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';
    if (query.slug) {
      return this.moviesService.findBySlug(query.slug, profileId, isAdmin);
    }
    return this.moviesService.findAll(query, profileId, isAdmin);
  }
}

@ApiTags('Admin Movies')
@Controller('admin/movies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
@ApiBearerAuth('access-token')
export class AdminMoviesController {
  constructor(private readonly moviesService: MoviesService) {}
  
  @Get()
  @ApiOperation({ summary: "Admin: barcha kinolar ro'yxati", description: 'Access: ADMIN, SUPERADMIN' })
  findAll() {
    return this.moviesService.adminFindAll();
  }
  
  @Get(':id')
  @ApiOperation({ summary: "Admin: kinoni ID bo'yicha olish", description: 'Access: ADMIN, SUPERADMIN' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.findOne(id);
  }
  
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'poster', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const tempDir = 'uploads/temp';
            if (!require('fs').existsSync(tempDir)) {
              require('fs').mkdirSync(tempDir, { recursive: true });
            }
            cb(null, tempDir);
          },
          filename: (req, file, cb) => {
            const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${unique}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['poster', 'video', 'title', 'description', 'releaseDate', 'country', 'genre'],
      properties: {
        poster: { type: 'string', format: 'binary' },
        video: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        description: { type: 'string' },
        releaseDate: { type: 'string', example: '2024-01-15' },
        country: { type: 'string' },
        genre: { type: 'string' },
        rating: { type: 'number', example: 8.5 },
        movieType: { type: 'string', enum: Object.values(MovieType) },
        subscriptionPlanId: { type: 'integer', example: 1 },
        categoryIds: {
          oneOf: [
            { type: 'array', items: { type: 'integer' }, example: [1, 2] },
            { type: 'string', example: '[1,2]' },
            { type: 'string', example: '1,2' },
          ],
        },
      },
    },
  })
  @ApiOperation({ summary: "Yangi kino qo'shish (poster + video)", description: 'Access: ADMIN' })
  create(
    @Body() dto: CreateMovieDto,
    @CurrentUser('sub') userId: number,
    @UploadedFiles() files: { poster?: Express.Multer.File[]; video?: Express.Multer.File[] },
  ) {
    const poster = files?.poster?.[0];
    const video = files?.video?.[0];

    if (!poster) throw new BadRequestException('Poster fayli yuklanmagan');
    if (!video) throw new BadRequestException('Video fayli yuklanmagan');

    if (!poster.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
      throw new BadRequestException("Poster faqat jpeg, png yoki webp formatda bo'lishi kerak");
    }

    if (!video.mimetype.match(/^video\/(mp4|x-matroska|webm|quicktime)$/)) {
      throw new BadRequestException("Video faqat mp4, mkv, webm yoki mov formatda bo'lishi kerak");
    }

    return this.moviesService.create(dto, userId, poster, video);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Admin: kinoni yangilash', description: 'Access: ADMIN, SUPERADMIN' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMovieDto) {
    return this.moviesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: "Admin: kinoni o'chirish", description: 'Access: ADMIN, SUPERADMIN' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.remove(id);
  }

  @Post(':id/files')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const tempDir = 'uploads/temp';
          if (!require('fs').existsSync(tempDir)) {
            require('fs').mkdirSync(tempDir, { recursive: true });
          }
          cb(null, tempDir);
        },
        filename: (req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'quality'],
      properties: {
        file: { type: 'string', format: 'binary' },
        quality: { type: 'string', enum: ['P240', 'P360', 'P480', 'P720', 'P1080', 'P4K'] },
        language: { type: 'string', example: 'uz', default: 'uzbek' },
      },
    },
  })
  @ApiOperation({ summary: "Admin: kino fayli qo'shish", description: 'Access: ADMIN, SUPERADMIN' })
  addFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateMovieFileDto,
  ) {
    if (!file) throw new BadRequestException('Fayl yuklanmagan');
    return this.moviesService.addMovieFileWithUpload(id, file, dto);
  }
}

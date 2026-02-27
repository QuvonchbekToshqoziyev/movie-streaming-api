import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Res,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { posterFilePipe, videoFilePipe } from './filemax/pipe';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { MovieQuality } from '@prisma/client';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('posters/:movieId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth('access-token')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({
    summary: 'Kino posteri yuklash',
    description: 'Access: ADMIN, SUPERADMIN',
  })
  uploadPoster(
    @Param('movieId', ParseIntPipe) movieId: number,
    @UploadedFile(posterFilePipe) file: Express.Multer.File,
  ) {
    return this.uploadService.savePoster(movieId, file);
  }

  @Get('posters/:movieId')
  @ApiOperation({ summary: 'Kino posterini olish (fayl)', description: 'Access: PUBLIC' })
  async servePoster(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Res() res: Response,
  ) {
    const filePath = await this.uploadService.getPosterPath(movieId);
    return res.sendFile(filePath);
  }

  @Post('videos/:movieId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth('access-token')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        quality: { type: 'string', enum: Object.values(MovieQuality) },
        language: { type: 'string', example: 'uzbek' },
      },
    },
  })
  @ApiOperation({
    summary: 'Kino video faylini yuklash',
    description: 'Access: ADMIN, SUPERADMIN',
  })
  uploadVideo(
    @Param('movieId', ParseIntPipe) movieId: number,
    @UploadedFile(videoFilePipe) file: Express.Multer.File,
    @Body('quality') quality: string,
    @Body('language') language: string = 'uzbek',
  ) {
    const parsedQuality = this.uploadService.parseQuality(quality);
    return this.uploadService.saveVideo(movieId, parsedQuality, language, file);
  }

  @Get('videos/:movieId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Kino videosini olish (movieId + quality)', description: 'Access: Authenticated' })
  @ApiQuery({ name: 'quality', enum: MovieQuality, required: true })
  async serveVideoByMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Query('quality') quality: string,
    @Res() res: Response,
  ) {
    const parsedQuality = this.uploadService.parseQuality(quality);
    const filePath = await this.uploadService.getVideoPath(
      movieId,
      parsedQuality,
    );
    return res.download(filePath);
  }

  @Get('files/:fileId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Kino videosini olish (fileId)', description: 'Access: Authenticated' })
  async serveVideoById(
    @Param('fileId', ParseIntPipe) fileId: number,
    @Res() res: Response,
  ) {
    const { path, filename } =
      await this.uploadService.getVideoPathById(fileId);
    return res.download(path, filename);
  }
}

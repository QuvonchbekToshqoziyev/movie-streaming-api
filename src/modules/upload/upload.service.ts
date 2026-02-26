import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { join } from 'path';
import { existsSync } from 'fs';
import { MovieQuality } from '@prisma/client';

const UPLOAD_ROOT = join(process.cwd(), 'uploads');

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  async savePoster(movieId: number, file: Express.Multer.File) {
    const movie = await this.prisma.movies.findUnique({ where: { id: movieId } });
    if (!movie) throw new NotFoundException('Kino topilmadi');

    const posterUrl = `/uploads/posters/${file.filename}`;

    await this.prisma.movies.update({
      where: { id: movieId },
      data: { posterUrl },
    });

    return {
      success: true,
      message: 'Poster yuklandi',
      data: { posterUrl },
    };
  }

  async getPosterPath(movieId: number): Promise<string> {
    const movie = await this.prisma.movies.findUnique({ where: { id: movieId } });
    if (!movie) throw new NotFoundException('Kino topilmadi');

    const relativePath = movie.posterUrl.replace(/^\//, '');
    const fullPath = join(process.cwd(), relativePath);

    if (!existsSync(fullPath)) {
      throw new NotFoundException('Poster fayli topilmadi');
    }

    return fullPath;
  }


  async saveVideo(
    movieId: number,
    quality: MovieQuality,
    language: string,
    file: Express.Multer.File,
  ) {
    const movie = await this.prisma.movies.findUnique({ where: { id: movieId } });
    if (!movie) throw new NotFoundException('Kino topilmadi');

    const fileUrl = `/uploads/videos/${file.filename}`;

    const existing = await this.prisma.movieFile.findFirst({
      where: { movieId, quality },
    });

    if (existing) {
      await this.prisma.movieFile.update({
        where: { id: existing.id },
        data: { fileUrl, language },
      });
    } else {
      await this.prisma.movieFile.create({
        data: { movieId, quality, fileUrl, language },
      });
    }

    return {
      success: true,
      message: 'Video yuklandi',
      data: { movieId, quality, language, fileUrl },
    };
  }

  async getVideoPath(movieId: number, quality: MovieQuality): Promise<string> {
    const movieFile = await this.prisma.movieFile.findFirst({
      where: { movieId, quality },
    });

    if (!movieFile) throw new NotFoundException('Video fayli topilmadi');

    const relativePath = movieFile.fileUrl.replace(/^\//, '');
    const fullPath = join(process.cwd(), relativePath);

    if (!existsSync(fullPath)) {
      throw new NotFoundException('Video fayli diskda topilmadi');
    }

    return fullPath;
  }

  async getVideoPathById(fileId: number): Promise<{ path: string; filename: string }> {
    const movieFile = await this.prisma.movieFile.findUnique({
      where: { id: fileId },
      include: { movie: { select: { title: true, slug: true } } },
    });

    if (!movieFile) throw new NotFoundException('Video fayli topilmadi');

    const relativePath = movieFile.fileUrl.replace(/^\//, '');
    const fullPath = join(process.cwd(), relativePath);

    if (!existsSync(fullPath)) {
      throw new NotFoundException('Video fayli diskda topilmadi');
    }

    return {
      path: fullPath,
      filename: `${movieFile.movie.slug}-${movieFile.quality}.mp4`,
    };
  }


  parseQuality(quality: string): MovieQuality {
    const valid = Object.values(MovieQuality);
    if (!valid.includes(quality as MovieQuality)) {
      throw new BadRequestException(
        `Noto'g'ri sifat. Mumkin bo'lgan qiymatlar: ${valid.join(', ')}`,
      );
    }
    return quality as MovieQuality;
  }
}
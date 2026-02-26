import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWatchHistoryDto } from './dto/create-watch-history.dto';

@Injectable()
export class WatchHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(profileId: number) {
    const history = await this.prisma.watchHistory.findMany({
      where: { profileId },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            slug: true,
            posterUrl: true,
            duration: true,
          },
        },
      },
      orderBy: { watchedAt: 'desc' },
    });

    return {
      success: true,
      data: history,
    };
  }

  async upsert(profileId: number, dto: CreateWatchHistoryDto) {
    const movie = await this.prisma.movies.findUnique({
      where: { id: dto.movieId },
    });
    if (!movie) throw new NotFoundException('Kino topilmadi');

    const entry = await this.prisma.watchHistory.upsert({
      where: {
        profileId_movieId: { profileId, movieId: dto.movieId },
      },
      update: {
        watchDuration: dto.watchDuration,
        watchPercentage: dto.watchPercentage,
        watchStatus: dto.watchStatus || 'watching',
        watchedAt: new Date(),
      },
      create: {
        profileId,
        movieId: dto.movieId,
        watchDuration: dto.watchDuration,
        watchPercentage: dto.watchPercentage,
        watchStatus: dto.watchStatus || 'watching',
      },
    });

    return {
      success: true,
      data: entry,
    };
  }

  async remove(profileId: number, movieId: number) {
    const entry = await this.prisma.watchHistory.findUnique({
      where: { profileId_movieId: { profileId, movieId } },
    });
    if (!entry) throw new NotFoundException('Tarix topilmadi');

    await this.prisma.watchHistory.delete({
      where: { profileId_movieId: { profileId, movieId } },
    });

    return { success: true, message: "Tarix o'chirildi" };
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddPlaylistItemDto } from './dto/playlist-item.dto';

@Injectable()
export class PlaylistItemService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyPlaylistOwner(profileId: number, playlistId: number) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) throw new NotFoundException('Playlist topilmadi');
    if (playlist.profileId !== profileId)
      throw new ForbiddenException('Ruxsat yo\'q');
    return playlist;
  }

  async add(profileId: number, playlistId: number, dto: AddPlaylistItemDto) {
    await this.verifyPlaylistOwner(profileId, playlistId);

    const movie = await this.prisma.movies.findUnique({
      where: { id: dto.movie_id },
    });
    if (!movie) throw new NotFoundException('Kino topilmadi');

    try {
      const item = await this.prisma.playlistItem.create({
        data: { playlistId, movieId: dto.movie_id },
        include: { movie: { select: { id: true, title: true } } },
      });

      return {
        success: true,
        message: 'Kino playlistga qo\'shildi',
        data: {
          id: item.id,
          movie_id: item.movieId,
          movie_title: item.movie.title,
          added_at: item.addedAt,
        },
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async remove(profileId: number, playlistId: number, itemId: number) {
    await this.verifyPlaylistOwner(profileId, playlistId);

    try {
      await this.prisma.playlistItem.delete({
        where: { id: itemId, playlistId },
      });
    } catch (e) {
        throw new NotFoundException('Kino playlistda topilmadi');
    }

    return {
      success: true,
      message: 'Kino playlistdan o\'chirildi',
    };
  }

  async removeByMovieId(
    profileId: number,
    playlistId: number,
    movieId: number,
  ) {
    await this.verifyPlaylistOwner(profileId, playlistId);

    try {
      await this.prisma.playlistItem.delete({
        where: { playlistId_movieId: { playlistId, movieId } },
      });
    } catch (e) {
        throw new NotFoundException('Kino playlistda topilmadi');
    }

    return {
      success: true,
      message: 'Kino playlistdan o\'chirildi',
    };
  }
}
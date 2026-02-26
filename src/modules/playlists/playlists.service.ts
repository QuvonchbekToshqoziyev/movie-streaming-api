import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlaylistDto, UpdatePlaylistDto } from './dto/create-playlist.dto';

@Injectable()
export class PlaylistService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(profileId: number) {
    const playlists = await this.prisma.playlist.findMany({
      where: { profileId },
      include: {
        _count: { select: { playlistItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: {
        playlists: playlists.map((p) => ({
          id: p.id,
          name: p.name,
          movie_count: p._count.playlistItems,
          created_at: p.createdAt,
          updated_at: p.updatedAt,
        })),
        total: playlists.length,
      },
    };
  }

  async findOne(profileId: number, playlistId: number) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        playlistItems: {
          orderBy: { addedAt: 'desc' },
          include: {
            movie: {
              select: {
                id: true,
                title: true,
                slug: true,
                posterUrl: true,
                releaseDate: true,
                rating: true,
                subscriptionPlan: { select: { name: true, price: true } },
              },
            },
          },
        },
      },
    });

    if (!playlist) throw new NotFoundException('Playlist topilmadi');
    if (playlist.profileId !== profileId)
      throw new ForbiddenException('Ruxsat yo\'q');

    return {
      success: true,
      data: {
        id: playlist.id,
        name: playlist.name,
        movies: playlist.playlistItems.map((item) => ({
          playlist_item_id: item.id,
          added_at: item.addedAt,
          ...item.movie,
          subscription_type:
            !item.movie.subscriptionPlan ||
            Number(item.movie.subscriptionPlan.price) === 0
              ? 'free'
              : 'premium',
        })),
        total: playlist.playlistItems.length,
        created_at: playlist.createdAt,
        updated_at: playlist.updatedAt,
      },
    };
  }

  async create(profileId: number, dto: CreatePlaylistDto) {
    const playlist = await this.prisma.playlist.create({
      data: { profileId, name: dto.name },
    });

    return {
      success: true,
      message: 'Playlist yaratildi',
      data: {
        id: playlist.id,
        name: playlist.name,
        created_at: playlist.createdAt,
      },
    };
  }

  async update(profileId: number, playlistId: number, dto: UpdatePlaylistDto) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) throw new NotFoundException('Playlist topilmadi');
    if (playlist.profileId !== profileId)
      throw new ForbiddenException('Ruxsat yo\'q');

    const updated = await this.prisma.playlist.update({
      where: { id: playlistId },
      data: { name: dto.name },
    });

    return {
      success: true,
      message: 'Playlist yangilandi',
      data: {
        id: updated.id,
        name: updated.name,
        updated_at: updated.updatedAt,
      },
    };
  }

  async remove(profileId: number, playlistId: number) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) throw new NotFoundException('Playlist topilmadi');
    if (playlist.profileId !== profileId)
      throw new ForbiddenException('Ruxsat yo\'q');

    await this.prisma.playlist.delete({ where: { id: playlistId } });

    return {
      success: true,
      message: 'Playlist o\'chirildi',
    };
  }
}
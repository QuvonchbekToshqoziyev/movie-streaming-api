import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(profileId: number) {
    const favorites = await this.prisma.favorite.findMany({
      where: { profileId },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            slug: true,
            posterUrl: true, 
            releaseDate: true,
            rating: true,
            movieType: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        movies: favorites.map((f) => ({
          id: f.movie.id,
          title: f.movie.title,
          slug: f.movie.slug,
          poster_url: f.movie.posterUrl,
          release_year: f.movie.releaseDate.getFullYear(),
          rating: f.movie.rating,
          subscription_type: f.movie.movieType === 'FREE' ? 'free' : 'premium',
        })),
        total: favorites.length,
      },
    };
  }

  async add(profileId: number, movieId: number) {
    const movie = await this.prisma.movies.findUnique({
      where: { id: movieId },
    });
    if (!movie) throw new NotFoundException('Kino topilmadi');

    const existing = await this.prisma.favorite.findUnique({
      where: { profileId_movieId: { profileId, movieId } },
    });
    if (existing) throw new ConflictException('Kino allaqachon sevimlilarda');

    const favorite = await this.prisma.favorite.create({
      data: { profileId, movieId },
      include: { movie: { select: { id: true, title: true } } },
    });

    return {
      success: true,
      message: "Kino sevimlilar ro'yxatiga qo'shildi",
      data: {
        id: favorite.id,
        movie_id: favorite.movieId,
        movie_title: favorite.movie.title,
        created_at: favorite.createdAt,
      },
    };
  }

  async remove(profileId: number, movieId: number) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { profileId_movieId: { profileId, movieId } },
    });
    if (!favorite) throw new NotFoundException('Kino sevimlilarda topilmadi');

    await this.prisma.favorite.delete({
      where: { profileId_movieId: { profileId, movieId } },
    });

    return {
      success: true,
      message: "Kino sevimlilar ro'yxatidan o'chirildi",
    };
  }
}

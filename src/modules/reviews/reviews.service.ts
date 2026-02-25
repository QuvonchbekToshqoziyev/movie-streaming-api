import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByMovie(movieId: number) {
    const movie = await this.prisma.movies.findUnique({ where: { id: movieId } });
    if (!movie) throw new NotFoundException('Kino topilmadi');

    const reviews = await this.prisma.review.findMany({
      where: { movieId },
      include: {
        profile: { select: { id: true, username: true, avatar_url: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      success: true,
      data: {
        reviews,
        average_rating: Math.round(avgRating * 10) / 10,
        count: reviews.length,
      },
    };
  }

  async create(movieId: number, profileId: number, dto: CreateReviewDto) {
    const movie = await this.prisma.movies.findUnique({ where: { id: movieId } });
    if (!movie) throw new NotFoundException('Kino topilmadi');

    const existing = await this.prisma.review.findUnique({
      where: { profileId_movieId: { profileId, movieId } },
    });
    if (existing) throw new ConflictException('Siz allaqachon bu kinoga sharh qoldirgansiz');

    const review = await this.prisma.review.create({
      data: {
        profileId,
        movieId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        profile: { select: { id: true, username: true } },
      },
    });

    return {
      success: true,
      message: 'Sharh muvaffaqiyatli qo\'shildi',
      data: review,
    };
  }

  async remove(movieId: number, reviewId: number, profileId: number, role: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Sharh topilmadi');
    if (review.movieId !== movieId) throw new NotFoundException('Sharh topilmadi');

    // Admins can delete any review, users only their own
    if (role === 'USER' && review.profileId !== profileId) {
      throw new ForbiddenException('Siz faqat o\'z sharhingizni o\'chira olasiz');
    }

    await this.prisma.review.delete({ where: { id: reviewId } });

    return {
      success: true,
      message: 'Sharh muvaffaqiyatli o\'chirildi',
    };
  }
}

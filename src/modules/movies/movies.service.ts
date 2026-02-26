import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { QueryMovieDto } from './dto/query-movie.dto';
import { MovieType, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) { }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Check if a profile has an active subscription.
   * Returns the subscription with plan details, or null.
   */
  private async getActiveSubscription(profileId: number | null) {
    if (!profileId) return null;

    const sub = await this.prisma.profileSubscription.findFirst({
      where: {
        profileId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { gte: new Date() },
      },
      include: {
        subscriptionPlan: true,
      },
      orderBy: { endDate: 'desc' },
    });

    return sub;
  }

  async create(dto: CreateMovieDto, createdBy: number) {
    const { categoryIds, ...movieData } = dto;
    const slug = this.generateSlug(dto.title);

    const movie = await this.prisma.movies.create({
      data: {
        ...movieData,
        slug,
        releaseDate: new Date(dto.releaseDate),
        posterUrl: dto.posterUrl || '',
        rating: dto.rating || 0,
        movieType: dto.movieType || MovieType.FREE,
        createdBy,
        movieCategories: categoryIds?.length
          ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
      },
      include: {
        movieCategories: { include: { category: true } },
        subscriptionPlan: { select: { id: true, name: true } },
      },
    });

    return {
      success: true,
      message: 'Yangi kino muvaffaqiyatli qo\'shildi',
      data: movie,
    };
  }

  async findAll(query: QueryMovieDto, profileId: number | null = null) {
    const { page = 1, limit = 20, category, search, subscription_type } = query;
    const skip = (page - 1) * limit;

    const activeSub = await this.getActiveSubscription(profileId);

    const where: any = {};

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (category) {
      where.movieCategories = {
        some: { category: { slug: category } },
      };
    }

    if (subscription_type) {
      // Explicit filter from query param
      where.movieType = subscription_type.toUpperCase() === 'PAID' ? MovieType.PAID : MovieType.FREE;
    } else if (!activeSub) {
      // No active subscription → only show FREE movies
      where.movieType = MovieType.FREE;
    }

    const [movies, total] = await Promise.all([
      this.prisma.movies.findMany({
        where,
        skip,
        take: limit,
        include: {
          movieCategories: { include: { category: { select: { id: true, name: true, slug: true } } } },
          subscriptionPlan: { select: { id: true, name: true, price: true } },
        },
        orderBy: { id: 'desc' },
      }),
      this.prisma.movies.count({ where }),
    ]);

    return {
      success: true,
      data: {
        movies: movies.map((m) => ({
          ...m,
          categories: m.movieCategories.map((mc) => mc.category.name),
          subscription_type: m.movieType,
        })),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findBySlug(slug: string, profileId: number | null = null) {
    const movie = await this.prisma.movies.findUnique({
      where: { slug },
      include: {
        movieCategories: { include: { category: true } },
        movieFiles: true,
        subscriptionPlan: { select: { id: true, name: true, price: true, allowed_qualities: true } },
        reviews: {
          select: { rating: true },
        },
      },
    });

    if (!movie) throw new NotFoundException('Kino topilmadi');

    // If movie is PAID, check that user has an active subscription
    const activeSub = await this.getActiveSubscription(profileId);

    if (movie.movieType === MovieType.PAID && !activeSub) {
      throw new ForbiddenException('Bu kinoni ko\'rish uchun obuna kerak. Iltimos, obuna sotib oling.');
    }

    // Increment view count
    await this.prisma.movies.update({
      where: { id: movie.id },
      data: { viewCount: { increment: 1 } },
    });

    const avgRating =
      movie.reviews.length > 0
        ? movie.reviews.reduce((sum, r) => sum + r.rating, 0) / movie.reviews.length
        : 0;

    // Filter movie files by subscription plan's allowed qualities
    let files = movie.movieFiles;
    if (activeSub && activeSub.subscriptionPlan.allowed_qualities.length > 0) {
      files = files.filter((f) =>
        activeSub.subscriptionPlan.allowed_qualities.includes(f.quality),
      );
    }

    return {
      success: true,
      data: {
        ...movie,
        categories: movie.movieCategories.map((mc) => mc.category.name),
        subscription_type: movie.movieType,
        files: files.map((f) => ({
          quality: f.quality,
          language: f.language,
          file_url: f.fileUrl,
        })),
        reviews: {
          average_rating: Math.round(avgRating * 10) / 10,
          count: movie.reviews.length,
        },
      },
    };
  }

  async findOne(id: number) {
    const movie = await this.prisma.movies.findUnique({
      where: { id },
      include: {
        movieCategories: { include: { category: true } },
        movieFiles: true,
        subscriptionPlan: { select: { id: true, name: true, price: true } },
        user: { select: { id: true, username: true } },
      },
    });
    if (!movie) throw new NotFoundException(`Kino #${id} topilmadi`);
    return movie;
  }

  async update(id: number, dto: UpdateMovieDto) {
    await this.findOne(id);
    const { categoryIds, ...movieData } = dto;

    const data: any = { ...movieData };
    if (dto.releaseDate) data.releaseDate = new Date(dto.releaseDate);
    if (dto.title) data.slug = this.generateSlug(dto.title);

    if (categoryIds) {
      // Remove old categories and add new
      await this.prisma.movieCategories.deleteMany({ where: { movieId: id } });
      data.movieCategories = { create: categoryIds.map((categoryId) => ({ categoryId })) };
    }

    const movie = await this.prisma.movies.update({
      where: { id },
      data,
      include: {
        movieCategories: { include: { category: true } },
        subscriptionPlan: { select: { id: true, name: true } },
      },
    });

    return {
      success: true,
      message: 'Kino muvaffaqiyatli yangilandi',
      data: movie,
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    // Delete related records first
    await this.prisma.movieCategories.deleteMany({ where: { movieId: id } });
    await this.prisma.movieFile.deleteMany({ where: { movieId: id } });
    await this.prisma.favorite.deleteMany({ where: { movieId: id } });
    await this.prisma.review.deleteMany({ where: { movieId: id } });
    await this.prisma.watchHistory.deleteMany({ where: { movieId: id } });
    await this.prisma.movies.delete({ where: { id } });
    return { success: true, message: 'Kino muvaffaqiyatli o\'chirildi' };
  }

  // Admin: get all movies with stats
  async adminFindAll() {
    const movies = await this.prisma.movies.findMany({
      include: {
        user: { select: { username: true } },
        subscriptionPlan: { select: { name: true, price: true } },
        _count: { select: { reviews: true, favorites: true } },
      },
      orderBy: { id: 'desc' },
    });

    return {
      success: true,
      data: {
        movies: movies.map((m) => ({
          id: m.id,
          title: m.title,
          slug: m.slug,
          releaseDate: m.releaseDate,
          movieType: m.movieType,
          subscription_type: m.movieType,
          viewCount: m.viewCount,
          review_count: m._count.reviews,
          favorite_count: m._count.favorites,
          created_by: m.user.username,
        })),
        total: movies.length,
      },
    };
  }

  // Add movie file
  async addMovieFile(movieId: number, dto: { quality: string; language?: string; fileUrl: string }) {
    await this.findOne(movieId);
    const file = await this.prisma.movieFile.create({
      data: {
        movieId,
        quality: dto.quality as any,
        language: dto.language,
        fileUrl: dto.fileUrl,
      },
    });
    return {
      success: true,
      message: 'Kino fayli muvaffaqiyatli yuklandi',
      data: file,
    };
  }
}


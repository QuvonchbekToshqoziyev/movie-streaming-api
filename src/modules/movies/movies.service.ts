import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { VideoProcessorService } from './video-processor.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { QueryMovieDto } from './dto/query-movie.dto';
import { MovieQuality, MovieType, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class MoviesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly videoProcessor: VideoProcessorService,
  ) {
    fs.mkdirSync(this.POSTER_DIR, { recursive: true });
    fs.mkdirSync(this.VIDEO_DIR, { recursive: true });
  }

  private readonly UPLOAD_ROOT = path.join(process.cwd(), 'uploads');
  private readonly POSTER_DIR = path.join(this.UPLOAD_ROOT, 'posters');
  private readonly VIDEO_DIR = path.join(this.UPLOAD_ROOT, 'videos');

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async getActiveSubscription(profileId: number | null) {
    if (!profileId) return null;

    return this.prisma.profileSubscription.findFirst({
      where: {
        profileId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { gte: new Date() },
      },
      include: { subscriptionPlan: true },
      orderBy: { endDate: 'desc' },
    });
  }

  async create(
    dto: CreateMovieDto,
    createdBy: number,
    posterFile: Express.Multer.File,
    videoFile: Express.Multer.File,
  ) {
    const movieType = dto.movieType ?? MovieType.FREE;

    if (movieType === MovieType.PAID && !dto.subscriptionPlanId) {
      throw new BadRequestException('PAID kino uchun subscriptionPlanId majburiy');
    }

    if (!videoFile?.path || !fs.existsSync(videoFile.path)) {
      throw new BadRequestException('Video fayl diskda topilmadi (multer diskStorage kerak)');
    }

    const { categoryIds, ...movieData } = dto;

    const baseSlug = this.generateSlug(dto.title);
    const exists = await this.prisma.movies.findFirst({
      where: { slug: baseSlug },
      select: { id: true },
    });
    const slug = exists ? `${baseSlug}-${Date.now()}` : baseSlug;

    const posterUrl = `/uploads/posters/${posterFile.filename}`;

    const meta = await this.videoProcessor.getVideoMetadata(videoFile.path);
    const duration = meta.duration;

    const movieCreateData: any = {
      ...movieData,
      slug,
      releaseDate: new Date(dto.releaseDate),
      posterUrl,
      duration,
      rating: dto.rating ?? 0,
      movieType,
      createdBy,
      subscriptionPlanId: dto.subscriptionPlanId ?? null,
      movieCategories: categoryIds?.length
        ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
        : undefined,
    };

    const movie = await this.prisma.movies.create({
      data: movieCreateData,
      include: {
        movieCategories: { include: { category: true } },
        subscriptionPlan: { select: { id: true, name: true } },
      },
    });

    this.processMovieUpload(movie.id, videoFile).catch((err) =>
      console.error(`[create] Video processing failed for movieId=${movie.id}, slug=${slug}:`, err),
    );

    return {
      success: true,
      message: "Yangi kino muvaffaqiyatli qo'shildi. Video qayta ishlanmoqda.",
      data: {
        ...movie,
        poster_url: `/movies/${movie.id}/poster`,
      },
    };
  }

  async findAll(query: QueryMovieDto, profileId: number | null = null) {
    const { page = 1, limit = 20, category, search, subscription_type } = query;
    const skip = (page - 1) * limit;

    const activeSub = await this.getActiveSubscription(profileId);

    const where: any = {};

    if (search) where.title = { contains: search, mode: 'insensitive' };

    if (category) {
      where.movieCategories = { some: { category: { slug: category } } };
    }

    if (subscription_type) {
      const wantsPaid = subscription_type.toUpperCase() === 'PAID';
      if (wantsPaid && !activeSub) where.movieType = MovieType.FREE;
      else where.movieType = wantsPaid ? MovieType.PAID : MovieType.FREE;
    } else if (!activeSub) {
      where.movieType = MovieType.FREE;
    }

    const [movies, total] = await Promise.all([
      this.prisma.movies.findMany({
        where,
        skip,
        take: limit,
        include: {
          movieCategories: {
            include: { category: { select: { id: true, name: true, slug: true } } },
          },
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
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
    };
  }

  async findBySlug(slug: string, profileId: number | null = null) {
    const movie = await this.prisma.movies.findUnique({
      where: { slug },
      include: {
        movieCategories: { include: { category: true } },
        movieFiles: true,
        subscriptionPlan: {
          select: { id: true, name: true, price: true, allowed_qualities: true },
        },
        reviews: { select: { rating: true } },
      },
    });

    if (!movie) throw new NotFoundException('Kino topilmadi');

    const activeSub = await this.getActiveSubscription(profileId);

    if (movie.movieType === MovieType.PAID && !activeSub) {
      throw new ForbiddenException("Bu kinoni ko'rish uchun obuna kerak. Iltimos, obuna sotib oling.");
    }

    await this.prisma.movies.update({
      where: { id: movie.id },
      data: { viewCount: { increment: 1 } },
    });

    const avgRating =
      movie.reviews.length > 0
        ? movie.reviews.reduce((sum, r) => sum + r.rating, 0) / movie.reviews.length
        : 0;

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

    return { success: true, message: 'Kino muvaffaqiyatli yangilandi', data: movie };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.movieCategories.deleteMany({ where: { movieId: id } });
    await this.prisma.movieFile.deleteMany({ where: { movieId: id } });
    await this.prisma.favorite.deleteMany({ where: { movieId: id } });
    await this.prisma.review.deleteMany({ where: { movieId: id } });
    await this.prisma.watchHistory.deleteMany({ where: { movieId: id } });
    await this.prisma.movies.delete({ where: { id } });
    return { success: true, message: "Kino muvaffaqiyatli o'chirildi" };
  }

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

  async addMovieFile(
    movieId: number,
    dto: { quality: MovieQuality; language?: string; fileUrl: string },
  ) {
    await this.findOne(movieId);

    const file = await this.prisma.movieFile.create({
      data: {
        movieId,
        quality: dto.quality,
        language: dto.language ?? 'uzbek',
        fileUrl: dto.fileUrl,
      },
    });

    return { success: true, message: 'Kino fayli muvaffaqiyatli yuklandi', data: file };
  }

  async processMovieUpload(movieId: number, file: Express.Multer.File) {
    const movie = await this.findOne(movieId);
    const movieDir = path.join(this.UPLOAD_ROOT, 'movies', movie.slug);
    fs.mkdirSync(movieDir, { recursive: true });

    if (!file?.path || !fs.existsSync(file.path)) {
      throw new BadRequestException('Video fayl diskda topilmadi (multer diskStorage kerak)');
    }

    const originalFileName = `original-${Date.now()}${path.extname(file.originalname)}`;
    const originalPath = path.join(movieDir, originalFileName);

    fs.renameSync(file.path, originalPath);

    this.videoProcessor
      .processVideo(originalPath, movieDir, movie.slug)
      .then(async (generatedFiles) => {
        for (const gen of generatedFiles) {
          const existing = await this.prisma.movieFile.findFirst({
            where: { movieId: movie.id, quality: gen.quality },
          });

          if (existing) {
            await this.prisma.movieFile.update({
              where: { id: existing.id },
              data: { fileUrl: gen.fileUrl },
            });
          } else {
            await this.prisma.movieFile.create({
              data: {
                movieId: movie.id,
                quality: gen.quality,
                fileUrl: gen.fileUrl,
                language: 'uzbek',
              },
            });
          }
        }

        // cleanup original
        if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
      })
      .catch((err) => {
        console.error(`[VideoProcessor] Error processing ${movie.slug}:`, err);
        if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
      });

    return {
      success: true,
      message: "Video yuklandi va qayta ishlanmoqda. Sifatlar tez orada paydo bo'ladi.",
    };
  }
}
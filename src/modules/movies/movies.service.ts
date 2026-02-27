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

    const movieDir = path.join(this.UPLOAD_ROOT, 'movies', slug);
    fs.mkdirSync(movieDir, { recursive: true });

    const posterExt = path.extname(posterFile.originalname);
    const posterName = `poster${posterExt}`;
    const posterDest = path.join(movieDir, posterName);
    fs.renameSync(posterFile.path, posterDest);
    const posterUrl = `/uploads/movies/${slug}/${posterName}`;

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

  private readonly QUALITY_ORDER: MovieQuality[] = [
    MovieQuality.P4K,
    MovieQuality.P1080,
    MovieQuality.P720,
    MovieQuality.P480,
    MovieQuality.P360,
    MovieQuality.P240,
  ];

  private getMaxQuality(files: { quality: MovieQuality }[]): MovieQuality | null {
    if (!files.length) return null;
    for (const q of this.QUALITY_ORDER) {
      if (files.some((f) => f.quality === q)) return q;
    }
    return files[0].quality;
  }

  async getMovieFile(movieId: number, quality: string, profileId: number | null = null, isAdmin = false) {
    const movie = await this.prisma.movies.findUnique({ where: { id: movieId } });
    if (!movie) throw new NotFoundException(`Kino #${movieId} topilmadi`);

    let allowedQualities: MovieQuality[] = [];
    if (movie.movieType === MovieType.PAID && !isAdmin) {
      const activeSub = await this.getActiveSubscription(profileId);
      if (!activeSub) {
        throw new ForbiddenException("Bu kinoni ko'rish uchun obuna kerak.");
      }
      allowedQualities = activeSub.subscriptionPlan.allowed_qualities as MovieQuality[];
    }

    if (quality === 'AUTO') {
      let files = await this.prisma.movieFile.findMany({ where: { movieId } });
      if (!files.length) throw new NotFoundException('Bu kino uchun fayl topilmadi');

      if (allowedQualities.length > 0) {
        files = files.filter((f) => allowedQualities.includes(f.quality));
        if (!files.length) throw new ForbiddenException('Sizning obunangiz uchun ruxsat berilgan sifat topilmadi.');
      }

      const best = files.sort(
        (a, b) => this.QUALITY_ORDER.indexOf(a.quality) - this.QUALITY_ORDER.indexOf(b.quality),
      )[0];

      return {
        success: true,
        data: {
          id: best.id,
          movieId: best.movieId,
          quality: best.quality,
          language: best.language,
          file_url: best.fileUrl,
        },
      };
    }

    const movieQuality = quality as MovieQuality;
    if (allowedQualities.length > 0 && !allowedQualities.includes(movieQuality)) {
      throw new ForbiddenException(`Sizning obunangiz ${quality} sifatiga ruxsat bermaydi.`);
    }

    const file = await this.prisma.movieFile.findFirst({
      where: { movieId, quality: movieQuality },
    });
    if (!file) throw new NotFoundException(`${quality} sifatdagi fayl topilmadi`);

    return {
      success: true,
      data: {
        id: file.id,
        movieId: file.movieId,
        quality: file.quality,
        language: file.language,
        file_url: file.fileUrl,
      },
    };
  }

  async findAll(query: QueryMovieDto, profileId: number | null = null, isAdmin = false) {
    const { page = 1, limit = 20, category, search, subscription_type } = query;
    const skip = (page - 1) * limit;

    const activeSub = isAdmin ? null : await this.getActiveSubscription(profileId);
    const hasFullAccess = isAdmin || !!activeSub;

    const where: any = {};

    if (search) where.title = { contains: search, mode: 'insensitive' };

    if (category) {
      where.movieCategories = { some: { category: { slug: category } } };
    }

    if (subscription_type) {
      const wantsPaid = subscription_type.toUpperCase() === 'PAID';
      if (wantsPaid && !hasFullAccess) where.movieType = MovieType.FREE;
      else where.movieType = wantsPaid ? MovieType.PAID : MovieType.FREE;
    } else if (!hasFullAccess) {
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
          id: m.id,
          title: m.title,
          slug: m.slug,
          poster_url: m.posterUrl,
          release_year: m.releaseDate.getFullYear(),
          rating: m.rating,
          subscription_type: m.movieType === MovieType.FREE ? 'free' : 'premium',
          categories: m.movieCategories.map((mc) => mc.category.name),
        })),
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
    };
  }

  async findBySlug(slug: string, profileId: number | null = null, isAdmin = false) {
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

    const activeSub = isAdmin ? null : await this.getActiveSubscription(profileId);

    if (movie.movieType === MovieType.PAID && !isAdmin && !activeSub) {
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
    if (!isAdmin && activeSub && activeSub.subscriptionPlan.allowed_qualities.length > 0) {
      files = files.filter((f) =>
        activeSub.subscriptionPlan.allowed_qualities.includes(f.quality),
      );
    }

    let is_favorite = false;
    if (profileId) {
      const fav = await this.prisma.favorite.findUnique({
        where: { profileId_movieId: { profileId, movieId: movie.id } },
      });
      is_favorite = !!fav;
    }

    return {
      success: true,
      data: {
        id: movie.id,
        title: movie.title,
        slug: movie.slug,
        description: movie.description,
        release_year: movie.releaseDate.getFullYear(),
        duration_minutes: movie.duration,
        poster_url: movie.posterUrl,
        rating: movie.rating,
        subscription_type: movie.movieType === MovieType.FREE ? 'free' : 'premium',
        view_count: movie.viewCount + 1,
        is_favorite,
        categories: movie.movieCategories.map((mc) => mc.category.name),
        files: files.map((f) => ({
          quality: f.quality,
          language: f.language,
          file_url: f.fileUrl,
        })),
        max_quality: this.getMaxQuality(files),
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

  async addMovieFileWithUpload(
    movieId: number,
    file: Express.Multer.File,
    dto: { quality: MovieQuality; language?: string },
  ) {
    const movie = await this.findOne(movieId);
    const movieDir = path.join(this.UPLOAD_ROOT, 'movies', movie.slug);
    fs.mkdirSync(movieDir, { recursive: true });

    const fileName = `${dto.quality.toLowerCase()}${path.extname(file.originalname)}`;
    const destPath = path.join(movieDir, fileName);
    fs.renameSync(file.path, destPath);
    const fileUrl = `/uploads/movies/${movie.slug}/${fileName}`;

    return this.addMovieFile(movieId, {
      quality: dto.quality,
      language: dto.language,
      fileUrl,
    });
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
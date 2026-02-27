import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProfileDto) {
    const existing = await this.prisma.profile.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing)
      throw new ConflictException('Email or username already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.prisma.profile.create({
      data: { ...dto, password: hashedPassword },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        full_name: true,
        phone: true,
        country: true,
        avatar_url: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          full_name: true,
          phone: true,
          country: true,
          avatar_url: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.profile.count({ where }),
    ]);
    return {
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        full_name: true,
        phone: true,
        country: true,
        avatar_url: true,
        status: true,
        createdAt: true,
      },
    });
    if (!profile) throw new NotFoundException(`Profile #${id} not found`);
    return {
      success: true,
      data: {
        user_id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        country: profile.country,
        created_at: profile.createdAt,
        avatar_url: profile.avatar_url,
      },
    };
  }

  async update(id: number, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException(`Profile #${id} not found`);
    const data: any = { ...dto };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    const updated = await this.prisma.profile.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        full_name: true,
        phone: true,
        country: true,
        avatar_url: true,
        status: true,
        updatedAt: true,
      },
    });
    return {
      success: true,
      message: 'Profil muvaffaqiyatli yangilandi',
      data: {
        user_id: updated.id,
        full_name: updated.full_name,
        phone: updated.phone,
        country: updated.country,
        updated_at: updated.updatedAt,
      },
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.profile.delete({ where: { id } });
    return { message: `Profile #${id} deleted successfully` };
  }
}

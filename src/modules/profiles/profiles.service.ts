import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
    if (existing) throw new ConflictException('Email or username already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.prisma.profile.create({
      data: { ...dto, password: hashedPassword },
      select: { id: true, username: true, email: true, role: true, full_name: true, phone: true, country: true, avatar_url: true, status: true, createdAt: true },
    });
  }

  findAll() {
    return this.prisma.profile.findMany({
      select: { id: true, username: true, email: true, role: true, full_name: true, phone: true, country: true, avatar_url: true, status: true, createdAt: true },
    });
  }

  async findOne(id: number) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, role: true, full_name: true, phone: true, country: true, avatar_url: true, status: true, createdAt: true },
    });
    if (!profile) throw new NotFoundException(`Profile #${id} not found`);
    return profile;
  }

  async update(id: number, dto: UpdateProfileDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    return this.prisma.profile.update({
      where: { id },
      data,
      select: { id: true, username: true, email: true, role: true, full_name: true, phone: true, country: true, avatar_url: true, status: true, updatedAt: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.profile.delete({ where: { id } });
    return { message: `Profile #${id} deleted successfully` };
  }
}

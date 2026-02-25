import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAdminDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) throw new ConflictException('Email or username already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: { ...dto, password: hashedPassword },
      select: { id: true, username: true, email: true, role: true, status: true, createdAt: true },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: { id: true, username: true, email: true, role: true, status: true, createdAt: true },
    });
  }

  async findOne(id: number) {
    const admin = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, role: true, status: true, createdAt: true },
    });
    if (!admin) throw new NotFoundException(`Admin #${id} not found`);
    return admin;
  }

  async update(id: number, dto: UpdateAdminDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, email: true, role: true, status: true, updatedAt: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: `Admin #${id} deleted successfully` };
  }
}

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateAdminDto } from '../admins/dto/create-admin.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto, avatarFile?: Express.Multer.File) {
    const existingProfile = await this.prisma.profile.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existingProfile) {
      throw new ConflictException('Email or username already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const avatarUrl = avatarFile
      ? `/uploads/avatars/${avatarFile.filename}`
      : '';

    const profile = await this.prisma.profile.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
        avatar_url: avatarUrl,
        full_name: '',
        phone: '',
        country: '',
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatar_url: true,
        createdAt: true,
      },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: profile.id,
      email: profile.email,
      username: profile.username,
      role: profile.role,
    });

    return {
      success: true,
      message: "Ro'yxatdan muvaffaqiyatli o'tdingiz",
      data: {
        user_id: profile.id,
        username: profile.username,
        role: profile.role,
        avatar_url: profile.avatar_url,
        created_at: profile.createdAt,
      },
    };
  }

  async profileLogin(dto: LoginDto, response: Response) {
    const profile = await this.prisma.profile.findUnique({
      where: { email: dto.email },
    });

    if (!profile) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, profile.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    let subscription: any = null;
    const activeSub = await this.prisma.profileSubscription.findFirst({
      where: {
        profileId: profile.id,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
      include: { subscriptionPlan: true },
      orderBy: { endDate: 'desc' },
    });
    if (activeSub) {
      subscription = {
        plan_name: activeSub.subscriptionPlan.name,
        expires_at: activeSub.endDate,
      };
    } else {
      subscription = {
        plan_name: 'Free',
        expires_at: null,
      };
    }

    const accessToken = await this.jwtService.signAsync({
      sub: profile.id,
      email: profile.email,
      username: profile.username,
      role: profile.role,
    });

    response.cookie('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      message: 'Muvaffaqiyatli kirildi',
      data: {
        user_id: profile.id,
        username: profile.username,
        role: profile.role,
        subscription,
      },
    };
  }

  async adminLogin(dto: LoginDto, response: Response) {
    const admin = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: admin.id,
      email: admin.email,
      username: admin.username,
      role: admin.role,
    });

    response.cookie('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      message: 'Admin muvaffaqiyatli kirildi',
      data: {
        user_id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    };
  }

  async adminRegister(dto: CreateAdminDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });

    if (existing) {
      throw new ConflictException('Email or username already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const admin = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
        role: dto.role ?? 'ADMIN',
        status: dto.status ?? 'ACTIVE',
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message: "Admin muvaffaqiyatli ro'yxatdan o'tdi",
      data: admin,
    };
  }

  async logout(response: Response) {
    response.clearCookie('auth_token');
    return {
      success: true,
      message: 'Muvaffaqiyatli tizimdan chiqildi',
    };
  }
}

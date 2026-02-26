import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfileSubscriptionDto } from './dto/create-profile-subscription.dto';
import { UpdateProfileSubscriptionDto } from './dto/update-profile-subscription.dto';

@Injectable()
export class ProfileSubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProfileSubscriptionDto) {
    return this.prisma.profileSubscription.create({
      data: {
        profileId: dto.profileId,
        subscriptionPlanId: dto.subscriptionPlanId,
        endDate: new Date(dto.endDate),
        status: dto.status,
      },
      include: {
        profile: { select: { id: true, username: true, email: true } },
        subscriptionPlan: true,
      },
    });
  }

  findAll() {
    return this.prisma.profileSubscription.findMany({
      include: {
        profile: { select: { id: true, username: true, email: true } },
        subscriptionPlan: true,
      },
    });
  }

  async findOne(id: number) {
    const sub = await this.prisma.profileSubscription.findUnique({
      where: { id },
      include: {
        profile: { select: { id: true, username: true, email: true } },
        subscriptionPlan: true,
      },
    });
    if (!sub)
      throw new NotFoundException(`Profile subscription #${id} not found`);
    return sub;
  }

  async findByProfile(profileId: number) {
    return this.prisma.profileSubscription.findMany({
      where: { profileId },
      include: { subscriptionPlan: true },
    });
  }

  async update(id: number, dto: UpdateProfileSubscriptionDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.profileSubscription.update({
      where: { id },
      data,
      include: {
        profile: { select: { id: true, username: true, email: true } },
        subscriptionPlan: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.profileSubscription.delete({ where: { id } });
    return { message: `Profile subscription #${id} deleted successfully` };
  }
}

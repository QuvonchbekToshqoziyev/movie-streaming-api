import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePaymentDto) {
    return this.prisma.payment.create({
      data: dto,
      include: {
        profile: { select: { id: true, username: true, email: true } },
        profileSubscription: true,
      },
    });
  }

  findAll() {
    return this.prisma.payment.findMany({
      include: {
        profile: { select: { id: true, username: true, email: true } },
        profileSubscription: true,
      },
    });
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        profile: { select: { id: true, username: true, email: true } },
        profileSubscription: true,
      },
    });
    if (!payment) throw new NotFoundException(`Payment #${id} not found`);
    return payment;
  }

  async findByProfile(profileId: number) {
    return this.prisma.payment.findMany({
      where: { profile_id: profileId },
      include: { profileSubscription: true },
    });
  }

  async update(id: number, dto: UpdatePaymentDto) {
    await this.findOne(id);
    return this.prisma.payment.update({
      where: { id },
      data: dto,
      include: {
        profile: { select: { id: true, username: true, email: true } },
        profileSubscription: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.payment.delete({ where: { id } });
    return { message: `Payment #${id} deleted successfully` };
  }
}

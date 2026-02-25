import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Injectable()
export class SubscriptionPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubscriptionPlanDto) {
    const existing = await this.prisma.subscriptionPlan.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Subscription plan name already exists');
    return this.prisma.subscriptionPlan.create({ data: dto });
  }

  findAll() {
    return this.prisma.subscriptionPlan.findMany();
  }

  async findOne(id: number) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException(`Subscription plan #${id} not found`);
    return plan;
  }

  async update(id: number, dto: UpdateSubscriptionPlanDto) {
    await this.findOne(id);
    return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.subscriptionPlan.delete({ where: { id } });
    return { message: `Subscription plan #${id} deleted successfully` };
  }
}

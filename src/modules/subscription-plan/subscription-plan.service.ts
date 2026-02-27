import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { PurchaseSubscriptionDto } from './dto/purchase-subscription.dto';

@Injectable()
export class SubscriptionPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubscriptionPlanDto) {
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { name: dto.name },
    });
    if (existing)
      throw new ConflictException('Subscription plan name already exists');
    return this.prisma.subscriptionPlan.create({ data: dto });
  }

  async findAll() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { is_active: true },
    });
    return {
      success: true,
      data: plans.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        duration_days: p.duration_days,
        features: p.features,
      })),
    };
  }

  async findOne(id: number) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
    if (!plan)
      throw new NotFoundException(`Subscription plan #${id} not found`);
    return plan;
  }

  async update(id: number, dto: UpdateSubscriptionPlanDto) {
    await this.findOne(id);
    return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.subscriptionPlan.delete({ where: { id } });
    return { success: true, message: `Subscription plan #${id} deleted successfully` };
  }

  async purchase(profileId: number, dto: PurchaseSubscriptionDto) {
    const plan = await this.findOne(dto.plan_id);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);

    const subscription = await this.prisma.profileSubscription.create({
      data: {
        profileId,
        subscriptionPlanId: plan.id,
        endDate,
        status: 'ACTIVE',
      },
      include: { subscriptionPlan: true },
    });

    const payment = await this.prisma.payment.create({
      data: {
        profile_id: profileId,
        profileSubscriptionId: subscription.id,
        amount: plan.price,
        status: 'COMPLETED',
        method: dto.payment_method,
      },
    });

    return {
      success: true,
      message: 'Obuna muvaffaqiyatli sotib olindi',
      data: {
        subscription: {
          id: subscription.id,
          plan: {
            id: plan.id,
            name: plan.name,
          },
          start_date: subscription.startDate,
          end_date: subscription.endDate,
          status: subscription.status,
          auto_renew: dto.auto_renew ?? false,
        },
        payment: {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          payment_method: payment.method,
        },
      },
    };
  }
}

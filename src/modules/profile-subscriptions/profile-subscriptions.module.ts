import { Module } from '@nestjs/common';
import { ProfileSubscriptionsController } from './profile-subscriptions.controller';
import { ProfileSubscriptionsService } from './profile-subscriptions.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProfileSubscriptionsController],
  providers: [ProfileSubscriptionsService],
  exports: [ProfileSubscriptionsService],
})
export class ProfileSubscriptionsModule {}

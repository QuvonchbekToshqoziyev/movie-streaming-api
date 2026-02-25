import { Module } from '@nestjs/common';
import { AdminsModule } from './modules/admins/admins.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { SubscriptionPlanModule } from './modules/subscription-plan/subscription-plan.module';
import { ProfileSubscriptionsModule } from './modules/profile-subscriptions/profile-subscriptions.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { MoviesModule } from './modules/movies/movies.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { WatchHistoryModule } from './modules/watch-history/watch-history.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AdminsModule,
    ProfilesModule,
    SubscriptionPlanModule,
    ProfileSubscriptionsModule,
    PaymentModule,
    CategoriesModule,
    MoviesModule,
    FavoritesModule,
    ReviewsModule,
    WatchHistoryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

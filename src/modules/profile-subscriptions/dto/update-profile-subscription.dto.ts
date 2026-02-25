import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileSubscriptionDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  subscriptionPlanId?: number;

  @ApiPropertyOptional({ example: '2026-03-24T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;
}

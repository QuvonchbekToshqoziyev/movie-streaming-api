import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProfileSubscriptionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  profileId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  subscriptionPlanId!: number;

  @ApiProperty({ example: '2026-03-24T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @ApiPropertyOptional({
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;
}

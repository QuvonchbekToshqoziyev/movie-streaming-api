import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class PurchaseSubscriptionDto {
  @ApiProperty({ example: 1, description: 'Subscription plan ID' })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  plan_id!: number;

  @ApiProperty({ enum: PaymentMethod, example: 'CARD' })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  payment_method!: PaymentMethod;

  @ApiPropertyOptional({ example: true, default: false })
  @IsBoolean()
  @IsOptional()
  auto_renew?: boolean = false;

  @ApiPropertyOptional({
    example: {
      card_number: '4242XXXXXXXX4242',
      expiry: '04/26',
      card_holder: 'ALIJON VALIYEV',
    },
  })
  @IsObject()
  @IsOptional()
  payment_details?: Record<string, any>;
}

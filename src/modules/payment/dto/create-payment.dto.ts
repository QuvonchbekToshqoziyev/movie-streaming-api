import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { IsEnum, IsInt, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  profile_id!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  profileSubscriptionId!: number;

  @ApiProperty({ example: 9.99 })
  @IsNumber()
  @Type(() => Number)
  amount!: number;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CARD })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}

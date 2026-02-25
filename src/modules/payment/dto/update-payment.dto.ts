import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePaymentDto {
  @ApiPropertyOptional({ example: 9.99 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ example: 'COMPLETED' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;
}

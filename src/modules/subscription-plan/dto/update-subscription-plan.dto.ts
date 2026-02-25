import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional({ example: 'Premium' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 9.99 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  duration_days?: number;

  @ApiPropertyOptional({ example: ['HD', '4K', 'Offline download'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

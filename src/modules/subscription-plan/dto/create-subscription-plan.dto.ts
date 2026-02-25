import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'Premium' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 9.99 })
  @IsNumber()
  @Type(() => Number)
  price!: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Type(() => Number)
  duration_days!: number;

  @ApiProperty({ example: ['HD', '4K', 'Offline download'] })
  @IsArray()
  @IsString({ each: true })
  features!: string[];

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

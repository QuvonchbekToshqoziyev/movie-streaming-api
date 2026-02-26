import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MovieQuality } from '@prisma/client';

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional({ example: 'Pro' })
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

  @ApiPropertyOptional({ example: ['HD sifatli kinolar', 'Reklamasiz'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({
    example: ['P240', 'P360', 'P480', 'P720'],
    description: 'Allowed video qualities',
  })
  @IsArray()
  @IsEnum(MovieQuality, { each: true })
  @IsOptional()
  allowed_qualities?: MovieQuality[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

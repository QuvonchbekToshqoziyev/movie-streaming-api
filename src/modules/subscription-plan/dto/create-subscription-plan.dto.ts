import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { MovieQuality } from '@prisma/client';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'Pro' })
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

  @ApiProperty({ example: ['HD sifatli kinolar', 'Reklamasiz'] })
  @IsArray()
  @IsString({ each: true })
  features!: string[];

  @ApiProperty({ example: ['P240', 'P360', 'P480', 'P720'], description: 'Allowed video qualities' })
  @IsArray()
  @IsEnum(MovieQuality, { each: true })
  allowed_qualities!: MovieQuality[];

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}


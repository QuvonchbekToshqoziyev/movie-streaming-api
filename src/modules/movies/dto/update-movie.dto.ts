import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { MovieType } from '@prisma/client';

export class UpdateMovieDto {
  @ApiPropertyOptional({ example: 'Yangilangan sarlavha' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Yangilangan ta\'rif' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2019-04-26T00:00:00.000Z' })
  @IsString()
  @IsOptional()
  releaseDate?: string;

  @ApiPropertyOptional({ example: 180 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  duration?: number;

  @ApiPropertyOptional({ example: 'USA' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 'https://example.com/poster.jpg' })
  @IsString()
  @IsOptional()
  posterUrl?: string;

  @ApiPropertyOptional({ example: 'Drama' })
  @IsString()
  @IsOptional()
  genre?: string;

  @ApiPropertyOptional({ example: 9.0 })
  @IsOptional()
  @Type(() => Number)
  rating?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  subscriptionPlanId?: number;

  @ApiPropertyOptional({ enum: MovieType, example: MovieType.PAID })
  @IsEnum(MovieType)
  @IsOptional()
  movieType?: MovieType;

  @ApiPropertyOptional({ example: [1, 2], description: 'Category IDs' })
  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  @Type(() => Number)
  categoryIds?: number[];
}

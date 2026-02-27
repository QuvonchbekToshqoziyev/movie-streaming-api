import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovieType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMovieDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsString()
  releaseDate!: string;

  @ApiProperty()
  @IsString()
  country!: string;

  @ApiProperty()
  @IsString()
  genre!: string;

  @ApiPropertyOptional({ enum: MovieType, default: MovieType.FREE })
  @IsOptional()
  @IsEnum(MovieType)
  movieType?: MovieType;

  @ApiPropertyOptional({ example: 1, description: 'Required if movieType=PAID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subscriptionPlanId?: number;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional({
    example: [1, 2],
    description:
      'Category IDs. Supports: [1,2], "1,2", "[1,2]", or repeated form fields.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;

    if (Array.isArray(value)) return value.map((v) => Number(v));

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map((v) => Number(v));
      } catch {}


      return value
        .replace(/[\[\]\s]/g, '')
        .split(',')
        .filter(Boolean)
        .map((v) => Number(v));
    }

    return [Number(value)];
  })
  @IsArray()
  @IsInt({ each: true })
  categoryIds?: number[];
}
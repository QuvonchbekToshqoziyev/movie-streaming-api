import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMovieDto {
  @ApiProperty({ example: 'Qasoskorlar: Abadiyat Jangi' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Film haqida batafsil ma\'lumot' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: '2018-04-27T00:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  releaseDate!: string;

  @ApiProperty({ example: 149 })
  @IsInt()
  @Type(() => Number)
  duration!: number;

  @ApiProperty({ example: 'USA' })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiPropertyOptional({ example: 'https://example.com/poster.jpg' })
  @IsString()
  @IsOptional()
  posterUrl?: string;

  @ApiProperty({ example: 'Action' })
  @IsString()
  @IsNotEmpty()
  genre!: string;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @Type(() => Number)
  rating?: number;

  @ApiProperty({ example: 1, description: 'Subscription plan ID' })
  @IsInt()
  @Type(() => Number)
  subscriptionPlanId!: number;

  @ApiPropertyOptional({ example: [1, 2], description: 'Category IDs' })
  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  @Type(() => Number)
  categoryIds?: number[];
}

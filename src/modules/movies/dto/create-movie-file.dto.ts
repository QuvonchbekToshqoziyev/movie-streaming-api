import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovieQuality } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMovieFileDto {
  @ApiProperty({
    enum: MovieQuality,
    example: MovieQuality.P720,
    description: 'Quality enum from Prisma (P240, P360, P480, P720, P1080, P4K)',
  })
  @IsEnum(MovieQuality)
  @IsNotEmpty()
  quality!: MovieQuality;

  @ApiPropertyOptional({ example: 'uzbek', default: 'uzbek' })
  @IsString()
  @IsOptional()
  language?: string = 'uzbek';

  @ApiProperty({ example: 'https://example.com/movies/film-p720.mp4' })
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;
}
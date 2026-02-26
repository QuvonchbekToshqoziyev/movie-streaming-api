import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMovieFileDto {
  @ApiProperty({
    example: 'P720',
    description: 'Quality: P240, P360, P480, P720, P1080, P4K',
  })
  @IsString()
  @IsNotEmpty()
  quality!: string;

  @ApiPropertyOptional({ example: 'uzbek', default: 'uzbek' })
  @IsString()
  @IsOptional()
  language?: string = 'uzbek';

  @ApiProperty({ example: 'https://example.com/movies/film-720p.mp4' })
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;
}

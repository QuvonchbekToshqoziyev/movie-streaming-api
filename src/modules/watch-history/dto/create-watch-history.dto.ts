import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWatchHistoryDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  movieId!: number;

  @ApiProperty({ example: 45, description: 'Watched duration in minutes' })
  @IsInt()
  @Type(() => Number)
  watchDuration!: number;

  @ApiProperty({ example: 75.5, description: 'Watched percentage' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  watchPercentage!: number;

  @ApiPropertyOptional({ example: 'watching', description: 'watching / completed / paused' })
  @IsString()
  @IsOptional()
  watchStatus?: string = 'watching';
}

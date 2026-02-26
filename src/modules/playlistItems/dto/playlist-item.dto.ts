import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class AddPlaylistItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  movie_id!: number;
}   
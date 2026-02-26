import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreatePlaylistDto {
  @ApiProperty({ example: 'My Favorites' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}

export class UpdatePlaylistDto {
  @ApiPropertyOptional({ example: 'Updated Name' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  name?: string;
}
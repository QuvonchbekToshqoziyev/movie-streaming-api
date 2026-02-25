import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Action' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'action' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiProperty({ example: 'Action movies and thrillers' })
  @IsString()
  @IsNotEmpty()
  description!: string;
}

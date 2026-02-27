import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('movies/:movieId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) { }

  @Get()
  @ApiOperation({ summary: 'Kinoning barcha sharhlari', description: 'Access: PUBLIC' })
  findByMovie(@Param('movieId', ParseIntPipe) movieId: number) {
    return this.reviewsService.findByMovie(movieId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Sharh qoldirish', description: 'Access: USER' })
  create(
    @Param('movieId', ParseIntPipe) movieId: number,
    @CurrentUser('sub') profileId: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(movieId, profileId, dto);
  }

  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER', 'ADMIN', 'SUPERADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Sharhni o'chirish", description: 'Access: USER (Author), ADMIN, SUPERADMIN' })
  remove(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @CurrentUser('sub') profileId: number,
    @CurrentUser('role') role: string,
  ) {
    return this.reviewsService.remove(movieId, reviewId, profileId, role);
  }
}

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
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('movies/:movieId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Kinoning barcha sharhlari' })
  findByMovie(@Param('movieId', ParseIntPipe) movieId: number) {
    return this.reviewsService.findByMovie(movieId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Sharh qoldirish' })
  create(
    @Param('movieId', ParseIntPipe) movieId: number,
    @CurrentUser('sub') profileId: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(movieId, profileId, dto);
  }

  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Sharhni o'chirish" })
  remove(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @CurrentUser('sub') profileId: number,
    @CurrentUser('role') role: string,
  ) {
    return this.reviewsService.remove(movieId, reviewId, profileId, role);
  }
}

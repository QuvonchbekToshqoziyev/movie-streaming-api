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
import { WatchHistoryService } from './watch-history.service';
import { CreateWatchHistoryDto } from './dto/create-watch-history.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Watch History')
@Controller('watch-history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class WatchHistoryController {
  constructor(private readonly watchHistoryService: WatchHistoryService) { }

  @Get()
  @ApiOperation({ summary: "Ko'rish tarixi", description: 'Access: PROFILE' })
  findAll(@CurrentUser('sub') profileId: number) {
    return this.watchHistoryService.findAll(profileId);
  }

  @Post()
  @ApiOperation({
    summary: "Ko'rish tarixini yozish",
    description: 'Access: PROFILE',
  })
  upsert(
    @CurrentUser('sub') profileId: number,
    @Body() dto: CreateWatchHistoryDto,
  ) {
    return this.watchHistoryService.upsert(profileId, dto);
  }

  @Delete(':movieId')
  @ApiOperation({
    summary: "Ko'rish tarixini o'chirish",
    description: 'Access: PROFILE',
  })
  remove(
    @CurrentUser('sub') profileId: number,
    @Param('movieId', ParseIntPipe) movieId: number,
  ) {
    return this.watchHistoryService.remove(profileId, movieId);
  }
}

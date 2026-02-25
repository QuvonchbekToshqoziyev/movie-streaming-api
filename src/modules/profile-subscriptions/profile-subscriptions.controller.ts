import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfileSubscriptionsService } from './profile-subscriptions.service';
import { CreateProfileSubscriptionDto } from './dto/create-profile-subscription.dto';
import { UpdateProfileSubscriptionDto } from './dto/update-profile-subscription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Profile Subscriptions')
@Controller('profile-subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ProfileSubscriptionsController {
  constructor(private readonly profileSubscriptionsService: ProfileSubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new profile subscription' })
  create(@Body() dto: CreateProfileSubscriptionDto) {
    return this.profileSubscriptionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all profile subscriptions' })
  findAll() {
    return this.profileSubscriptionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get profile subscription by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.profileSubscriptionsService.findOne(id);
  }

  @Get('profile/:profileId')
  @ApiOperation({ summary: 'Get subscriptions by profile ID' })
  findByProfile(@Param('profileId', ParseIntPipe) profileId: number) {
    return this.profileSubscriptionsService.findByProfile(profileId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update profile subscription by ID' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProfileSubscriptionDto) {
    return this.profileSubscriptionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete profile subscription by ID' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.profileSubscriptionsService.remove(id);
  }
}

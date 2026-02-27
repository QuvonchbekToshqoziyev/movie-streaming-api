import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Profile')
@Controller('profile')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) { }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all profiles (paginated, searchable)', description: 'Access: ADMIN, SUPERADMIN' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, example: 'alijon', description: 'Search by username, full name, or email (partial match)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '10', 10) || 10));
    return this.profilesService.findAll(p, l, search);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile', description: 'Access: USER' })
  getMyProfile(@CurrentUser('sub') profileId: number) {
    return this.profilesService.findOne(profileId);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update current user profile', description: 'Access: USER' })
  updateMyProfile(
    @CurrentUser('sub') profileId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.update(profileId, dto);
  }
}

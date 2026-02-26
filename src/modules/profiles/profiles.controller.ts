import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) { }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile', description: 'Access: PROFILE' })
  getMyProfile(@CurrentUser('sub') profileId: number) {
    return this.profilesService.findOne(profileId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update current user profile', description: 'Access: PROFILE' })
  updateMyProfile(
    @CurrentUser('sub') profileId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.update(profileId, dto);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create a new profile (Admin)',
    description: 'Access: ADMIN, SUPERADMIN',
  })
  create(@Body() dto: CreateProfileDto) {
    return this.profilesService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get all profiles (Admin)',
    description: 'Access: ADMIN, SUPERADMIN',
  })
  findAll() {
    return this.profilesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get profile by ID (Admin)',
    description: 'Access: ADMIN, SUPERADMIN',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.profilesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update profile by ID (Admin)',
    description: 'Access: ADMIN, SUPERADMIN',
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProfileDto) {
    return this.profilesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Delete profile by ID (Admin)',
    description: 'Access: ADMIN, SUPERADMIN',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.profilesService.remove(id);
  }
}

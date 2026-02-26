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
import { SubscriptionPlanService } from './subscription-plan.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Subscription Plans')
@Controller('subscription-plan')
export class SubscriptionPlanController {
  constructor(
    private readonly subscriptionPlanService: SubscriptionPlanService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create a new subscription plan (Superadmin)',
    description: 'Access: SUPERADMIN',
  })
  create(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionPlanService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all subscription plans',
    description: 'Access: PUBLIC',
  })
  findAll() {
    return this.subscriptionPlanService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get subscription plan by ID',
    description: 'Access: PUBLIC',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionPlanService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update subscription plan (Superadmin)',
    description: 'Access: SUPERADMIN',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.subscriptionPlanService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Delete subscription plan (Superadmin)',
    description: 'Access: SUPERADMIN',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionPlanService.remove(id);
  }
}

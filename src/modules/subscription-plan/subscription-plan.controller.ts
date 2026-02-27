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
import { PurchaseSubscriptionDto } from './dto/purchase-subscription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Subscription Plans')
@Controller('subscription')
export class SubscriptionPlanController {
  constructor(
    private readonly subscriptionPlanService: SubscriptionPlanService,
  ) { }

  @Post('plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create a new subscription plan',
    description: 'Access: ADMIN, SUPERADMIN',
  })
  create(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionPlanService.create(dto);
  }

  @Get('plans')
  @ApiOperation({
    summary: 'Get all subscription plans',
    description: 'Access: PUBLIC',
  })
  findAll() {
    return this.subscriptionPlanService.findAll();
  }

  @Get('plans/:id')
  @ApiOperation({
    summary: 'Get subscription plan by ID',
    description: 'Access: PUBLIC',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionPlanService.findOne(id);
  }

  @Patch('plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update subscription plan',
    description: 'Access: ADMIN, SUPERADMIN',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.subscriptionPlanService.update(id, dto);
  }

  @Delete('plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Delete subscription plan',
    description: 'Access: ADMIN, SUPERADMIN',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionPlanService.remove(id);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Purchase a subscription plan',
    description: 'Access: USER',
  })
  purchase(
    @CurrentUser('sub') profileId: number,
    @Body() dto: PurchaseSubscriptionDto,
  ) {
    return this.subscriptionPlanService.purchase(profileId, dto);
  }
}

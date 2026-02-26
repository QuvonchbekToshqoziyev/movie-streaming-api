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
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post()
  @ApiOperation({
    summary: 'Create a new payment',
    description: 'Access: PROFILE',
  })
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments', description: 'Access: PROFILE' })
  findAll() {
    return this.paymentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID', description: 'Access: PROFILE' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.findOne(id);
  }

  @Get('profile/:profileId')
  @ApiOperation({
    summary: 'Get payments by profile ID',
    description: 'Access: PROFILE',
  })
  findByProfile(@Param('profileId', ParseIntPipe) profileId: number) {
    return this.paymentService.findByProfile(profileId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update payment by ID',
    description: 'Access: PROFILE',
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePaymentDto) {
    return this.paymentService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete payment by ID',
    description: 'Access: PROFILE',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.remove(id);
  }
}

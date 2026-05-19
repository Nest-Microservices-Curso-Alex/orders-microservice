import { Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class OrdersService {
  logger = new Logger('OrderService');
  constructor(private prisma: PrismaService) {
    this.logger.log('Database connected');
  }

  create(createOrderDto: CreateOrderDto) {
    return createOrderDto;
  }

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }
}

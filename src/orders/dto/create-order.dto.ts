import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { OrderStatus } from 'generated/prisma';
import { OrderStatusList } from '../enum/order.enum';

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  totalAmount!: number;

  @IsNumber()
  @IsPositive()
  totalItem!: number;

  @IsEnum(OrderStatusList, {
    message: `Possible status values are ${Object.values(OrderStatusList).join(', ')}`,
  })
  @IsOptional()
  status: OrderStatus = OrderStatus.PENDING;

  @IsBoolean()
  @IsOptional()
  paid: boolean = false;
}

import { OrderStatus } from 'generated/prisma/enums';

export const OrderStatusList = [
  OrderStatus.PAID,
  OrderStatus.PENDING,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

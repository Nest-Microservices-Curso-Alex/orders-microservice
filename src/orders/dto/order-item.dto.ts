import { IsNumber, IsPositive } from 'class-validator';

export class OrderItemDto {
  @IsNumber()
  @IsPositive()
  productId!: number;

  @IsNumber()
  @IsPositive()
  @IsNumber()
  quantity!: number;

  @IsPositive()
  price!: number;
}

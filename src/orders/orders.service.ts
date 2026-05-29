import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto } from './dto';
import { NATS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';
import { Product } from './entities/product.entity';
import { OrderWithProducts } from './interfaces/order-with-products.interface';

interface OrderItem {
  name: string | undefined;
  productId: number;
  quantity: number;
  price: number;
}

@Injectable()
export class OrdersService {
  logger = new Logger('OrderService');

  constructor(
    private prisma: PrismaService,
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {
    this.logger.log('Database connected');
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      // 1. confirmar las ids de los productos
      const productsIds = createOrderDto.items.map((item) => item.productId);
      const products = await firstValueFrom(
        this.client.send<Product[]>({ cmd: 'validate_product' }, productsIds),
      );

      // 2. Cálculos de los valores
      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const product = products.find(
          (product) => product.id === orderItem.productId,
        );

        return product ? acc + product.price * orderItem.quantity : acc;
      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      // 3. crear una transacción de base de datos
      const order = await this.prisma.order.create({
        data: {
          totalAmount,
          totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price:
                  products.find((product) => product.id === orderItem.productId)
                    ?.price ?? 0,
                productId: orderItem.productId,
                quantity: orderItem.quantity,
              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });

      const orderItems: OrderItem[] = (
        order.OrderItem as Array<{
          price: number;
          quantity: number;
          productId: number;
        }>
      ).map((orderItem) => {
        const matchedProduct = products.find(
          (product) => product.id === orderItem.productId,
        );

        return {
          ...orderItem,
          name: matchedProduct?.name ?? 'null',
        };
      });

      return {
        ...order,
        OrderItem: orderItems,
      };
    } catch (error) {
      console.error(error);
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Check logs',
      });
    }
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const totalPages = await this.prisma.order.count({
      where: { status: orderPaginationDto.status },
    });

    const currentPage = orderPaginationDto.page;
    const perPage = orderPaginationDto.limit;

    return {
      data: await this.prisma.order.findMany({
        skip: (currentPage - 1) * perPage,
        take: perPage,
        where: {
          status: orderPaginationDto.status,
        },
      }),
      meta: {
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil(totalPages / perPage),
      },
    };
  }

  async findOne(id: string) {
    const order = (await this.prisma.order.findUnique({
      where: { id },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    })) as {
      id: string;
      status: string;
      OrderItem: Array<{ price: number; quantity: number; productId: number }>;
    } | null;

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order whit id ${id} not found`,
      });
    }

    // order is guaranteed to exist here (checked above), narrow the type
    const productIds = order.OrderItem.map((orderItem) => orderItem.productId);

    const products = await firstValueFrom(
      this.client.send<Product[]>({ cmd: 'validate_product' }, productIds),
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name:
          products.find((product) => product.id === orderItem.productId)
            ?.name ?? 'null',
      })),
    };
  }

  async changeStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;

    const order = await this.findOne(id);

    if (order.status === status) {
      return order;
    }

    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async createPaymentSession(order: OrderWithProducts) {
    const paymentSession = await firstValueFrom<unknown>(
      this.client.send('create.payment.session', {
        orderId: order.id,
        currency: 'usd',
        items: [
          {
            name: 'producto 1',
            price: 100,
            quantity: 2,
          },
        ],
      }),
    );

    return paymentSession;
  }
}

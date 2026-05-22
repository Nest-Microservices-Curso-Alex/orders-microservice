import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from 'src/prisma.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs, NATS_SERVICE } from 'src/config';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
  imports: [
    ClientsModule.register([
      {
        // name: PRODUCT_SERVICE,
        name: NATS_SERVICE,
        // transport: Transport.TCP,
        transport: Transport.NATS,
        options: {
          // host: envs.productMsHost,
          // port: envs.productMsPort,
          servers: envs.natsServers,
        },
      },
    ]),
  ],
})
export class OrdersModule {}

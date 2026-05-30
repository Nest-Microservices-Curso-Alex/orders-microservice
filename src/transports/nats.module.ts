import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NATS_SERVICE, envs } from 'src/config';

@Module({
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
          servers: envs.natsService,
        },
      },
    ]),
  ],
  exports: [
    ClientsModule.register([
      {
        // name: PRODUCT_SERVICE,
        name: NATS_SERVICE,
        // transport: Transport.TCP,
        transport: Transport.NATS,
        options: {
          // host: envs.productMsHost,
          // port: envs.productMsPort,
          servers: envs.natsService,
        },
      },
    ]),
  ],
})
export class NatsModule {}

import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { TripsModule } from './trips/trips.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { GatewayModule } from './gateways/gateways.module';
import { UploadModule } from './upload/upload.module';
import { RoutesModule } from './routes/routes.module';
import { OrdersModule } from './orders/orders.module';
import { MessagesModule } from './messages/messages.module';
import { ObjectsModule } from './objects/objects.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
        }),
        PrismaModule,
        NotificationsModule,
        AuthModule,
        UsersModule,
        VehiclesModule,
        TripsModule,
        ShipmentsModule,
        GatewayModule,
        UploadModule,
        RoutesModule,
        OrdersModule,
        MessagesModule,
        ObjectsModule,
    ],
})
export class AppModule { }

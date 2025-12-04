import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { TripsModule } from '../trips/trips.module';

@Module({
    imports: [TripsModule],
    providers: [AppGateway],
})
export class GatewayModule { }

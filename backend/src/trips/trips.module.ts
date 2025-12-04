import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { RoutesModule } from '../routes/routes.module';

@Module({
    imports: [RoutesModule],
    controllers: [TripsController],
    providers: [TripsService],
    exports: [TripsService],
})
export class TripsModule { }

import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { VehicleChangeRequestService } from './vehicle-change-request.service';
import { VehicleChangeRequestController } from './vehicle-change-request.controller';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [MailModule],
    controllers: [VehiclesController, VehicleChangeRequestController],
    providers: [VehiclesService, VehicleChangeRequestService],
    exports: [VehiclesService, VehicleChangeRequestService],
})
export class VehiclesModule { }

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehiclesModule = void 0;
const common_1 = require("@nestjs/common");
const vehicles_service_1 = require("./vehicles.service");
const vehicles_controller_1 = require("./vehicles.controller");
const vehicle_change_request_service_1 = require("./vehicle-change-request.service");
const vehicle_change_request_controller_1 = require("./vehicle-change-request.controller");
const mail_module_1 = require("../mail/mail.module");
let VehiclesModule = class VehiclesModule {
};
exports.VehiclesModule = VehiclesModule;
exports.VehiclesModule = VehiclesModule = __decorate([
    (0, common_1.Module)({
        imports: [mail_module_1.MailModule],
        controllers: [vehicles_controller_1.VehiclesController, vehicle_change_request_controller_1.VehicleChangeRequestController],
        providers: [vehicles_service_1.VehiclesService, vehicle_change_request_service_1.VehicleChangeRequestService],
        exports: [vehicles_service_1.VehiclesService, vehicle_change_request_service_1.VehicleChangeRequestService],
    })
], VehiclesModule);
//# sourceMappingURL=vehicles.module.js.map
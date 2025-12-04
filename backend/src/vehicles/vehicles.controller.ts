import { Controller, Get, Post, Put, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
    constructor(private readonly vehiclesService: VehiclesService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    @ApiOperation({ summary: 'Register a new vehicle' })
    create(@Body() createVehicleDto: any, @Request() req) {
        return this.vehiclesService.create({
            ...createVehicleDto,
            driver: { connect: { id: req.user.userId } },
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my-vehicles')
    @ApiOperation({ summary: 'Get vehicles of authenticated driver' })
    getMyVehicles(@Request() req) {
        return this.vehiclesService.findByDriver(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('my-vehicle')
    @ApiOperation({ summary: 'Update or create vehicle of authenticated driver' })
    @ApiBody({
        schema: {
            example: {
                brand: 'Fiat',
                model: 'Strada',
                year: 2022,
                color: 'Branco',
                plate: 'ABC1D23',
                type: 'CAR',
                photo: 'data:image/jpeg;base64,...',
            },
        },
    })
    updateMyVehicle(@Body() updateVehicleDto: any, @Request() req) {
        return this.vehiclesService.updateOrCreateVehicle(req.user.userId, updateVehicleDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    @ApiOperation({ summary: 'List all vehicles (Admin)' })
    findAll() {
        return this.vehiclesService.findAll();
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id/approve')
    @ApiOperation({ summary: 'Approve a vehicle (Admin)' })
    approve(
        @Param('id') id: string,
        @Body() body: { notes?: string },
        @Request() req,
    ) {
        return this.vehiclesService.updateStatus(id, 'APPROVED', req.user.userId, body.notes);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id/reject')
    @ApiOperation({ summary: 'Reject a vehicle (Admin)' })
    reject(
        @Param('id') id: string,
        @Body() body: { notes?: string },
        @Request() req,
    ) {
        return this.vehiclesService.updateStatus(id, 'REJECTED', req.user.userId, body.notes);
    }
}

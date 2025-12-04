import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { TripsService } from './trips.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('trips')
@ApiBearerAuth()
@Controller('trips')
export class TripsController {
    constructor(private readonly tripsService: TripsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    @ApiOperation({ summary: 'Create a new trip/route' })
    @ApiBody({
        schema: {
            example: {
                originName: 'São Paulo, SP',
                originLat: -23.5505,
                originLng: -46.6333,
                destName: 'Rio de Janeiro, RJ',
                destLat: -22.9068,
                destLng: -43.1729,
                departureAt: '2024-01-15T08:00:00Z',
                vehicleId: 'uuid-do-veiculo',
                availableSeats: 3,
                availableCapacityKg: 50,
                pricePerKm: 0.5,
                notes: 'Viagem com paradas em Taubaté e Resende',
            },
        },
    })
    async create(@Body() createTripDto: any, @Request() req) {
        console.log('======================================');
        console.log('[TripsController] POST /trips - REQUISICAO RECEBIDA');
        console.log('[TripsController] Timestamp:', new Date().toISOString());
        console.log('[TripsController] User:', JSON.stringify(req.user));
        console.log('[TripsController] Body:', JSON.stringify(createTripDto));
        console.log('======================================');

        try {
            const result = await this.tripsService.create(createTripDto, req.user.userId);
            console.log('[TripsController] Trip criada com sucesso:', result.id);
            return result;
        } catch (error) {
            console.error('[TripsController] ERRO ao criar trip:', error.message);
            console.error('[TripsController] Stack:', error.stack);
            throw error;
        }
    }

    @Get()
    @ApiOperation({ summary: 'Search trips' })
    @ApiQuery({ name: 'status', required: false, enum: ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] })
    @ApiQuery({ name: 'fromDate', required: false, description: 'Filter trips from this date' })
    findAll(@Query() query: any) {
        return this.tripsService.findAll(query);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my-trips')
    @ApiOperation({ summary: 'Get trips created by the authenticated driver' })
    getMyTrips(@Request() req) {
        return this.tripsService.findByDriver(req.user.userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get trip details' })
    findOne(@Param('id') id: string) {
        return this.tripsService.findOne(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id/start')
    @ApiOperation({ summary: 'Start a scheduled trip' })
    startTrip(@Param('id') id: string, @Request() req) {
        return this.tripsService.startTrip(id, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id/complete')
    @ApiOperation({ summary: 'Complete an active trip' })
    completeTrip(@Param('id') id: string, @Request() req) {
        return this.tripsService.completeTrip(id, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id/cancel')
    @ApiOperation({ summary: 'Cancel a trip' })
    cancelTrip(@Param('id') id: string, @Request() req) {
        return this.tripsService.cancelTrip(id, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id/location')
    @ApiOperation({ summary: 'Update trip location' })
    @ApiBody({
        schema: {
            example: { lat: -23.5505, lng: -46.6333 },
        },
    })
    updateLocation(@Param('id') id: string, @Body() body: { lat: number; lng: number }) {
        return this.tripsService.updateLocation(id, body.lat, body.lng);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id')
    @ApiOperation({ summary: 'Update a trip' })
    @ApiBody({
        schema: {
            example: {
                originName: 'São Paulo, SP',
                originLat: -23.5505,
                originLng: -46.6333,
                destName: 'Rio de Janeiro, RJ',
                destLat: -22.9068,
                destLng: -43.1729,
                departureAt: '2024-01-15T08:00:00Z',
                notes: 'Viagem com paradas em Taubaté e Resende',
            },
        },
    })
    updateTrip(@Param('id') id: string, @Body() updateTripDto: any, @Request() req) {
        return this.tripsService.update(id, updateTripDto, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a trip' })
    deleteTrip(@Param('id') id: string, @Request() req) {
        return this.tripsService.delete(id, req.user.userId);
    }
}

import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('routes')
@Controller('routes')
export class RoutesController {
    constructor(private readonly routesService: RoutesService) { }

    @Post('calculate')
    @ApiOperation({ summary: 'Calculate route between two points' })
    @ApiBody({
        schema: {
            example: {
                originLat: -23.5505,
                originLng: -46.6333,
                destLat: -22.9068,
                destLng: -43.1729,
                departureAt: '2024-01-15T08:00:00Z',
            },
        },
    })
    async calculateRoute(
        @Body()
        body: {
            originLat: number;
            originLng: number;
            destLat: number;
            destLng: number;
            departureAt: string;
        },
    ) {
        const departureDate = new Date(body.departureAt);
        const routeInfo = await this.routesService.calculateRoute(
            body.originLat,
            body.originLng,
            body.destLat,
            body.destLng,
            departureDate,
        );

        return {
            ...routeInfo,
            wazeUrl: this.routesService.getWazeNavigationUrl(body.destLat, body.destLng),
            googleMapsUrl: this.routesService.getGoogleMapsNavigationUrl(
                body.originLat,
                body.originLng,
                body.destLat,
                body.destLng,
            ),
        };
    }

    @Get('geocode')
    @ApiOperation({ summary: 'Geocode an address to coordinates' })
    @ApiQuery({ name: 'address', example: 'Avenida Paulista, São Paulo' })
    async geocode(@Query('address') address: string) {
        const result = await this.routesService.geocodeAddress(address);
        if (!result) {
            return { error: 'Endereço não encontrado' };
        }
        return result;
    }

    @Get('reverse-geocode')
    @ApiOperation({ summary: 'Get address from coordinates' })
    @ApiQuery({ name: 'lat', example: -23.5505 })
    @ApiQuery({ name: 'lng', example: -46.6333 })
    async reverseGeocode(@Query('lat') lat: string, @Query('lng') lng: string) {
        const address = await this.routesService.reverseGeocode(
            parseFloat(lat),
            parseFloat(lng),
        );
        if (!address) {
            return { error: 'Endereço não encontrado' };
        }
        return { address };
    }
}

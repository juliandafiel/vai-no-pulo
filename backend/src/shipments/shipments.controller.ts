import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('shipments')
@ApiBearerAuth()
@Controller('shipments')
export class ShipmentsController {
    constructor(private readonly shipmentsService: ShipmentsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    @ApiOperation({ summary: 'Create a shipment' })
    create(@Body() createShipmentDto: any, @Request() req) {
        return this.shipmentsService.create({
            ...createShipmentDto,
            client: { connect: { id: req.user.userId } },
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    @ApiOperation({ summary: 'List my shipments' })
    findAll(@Request() req) {
        return this.shipmentsService.findAll(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id/status')
    @ApiOperation({ summary: 'Update shipment status' })
    updateStatus(@Param('id') id: string, @Body('status') status: any) {
        return this.shipmentsService.updateStatus(id, status);
    }
}

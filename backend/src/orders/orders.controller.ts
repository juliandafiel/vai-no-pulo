import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    @ApiOperation({ summary: 'Create a new order/request' })
    @ApiBody({
        schema: {
            example: {
                tripId: 'uuid-do-percurso',
                description: 'Caixa com eletronicos',
                weight: 5.5,
                dimensions: '40x30x20cm',
                estimatedPrice: 75.00,
                notes: 'Fragil, manusear com cuidado',
            },
        },
    })
    create(@Body() createOrderDto: any, @Request() req) {
        return this.ordersService.create(createOrderDto, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my-orders')
    @ApiOperation({ summary: 'Get orders for the authenticated user' })
    getMyOrders(@Request() req) {
        return this.ordersService.findMyOrders(req.user.userId, req.user.role);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('pending-count')
    @ApiOperation({ summary: 'Get count of pending orders' })
    getPendingCount(@Request() req) {
        return this.ordersService.countPendingOrders(req.user.userId, req.user.role);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('mark-as-read')
    @ApiOperation({ summary: 'Mark all pending orders as read' })
    markAsRead(@Request() req) {
        return this.ordersService.markAsRead(req.user.userId, req.user.role);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id/accept')
    @ApiOperation({ summary: 'Accept an order (driver only)' })
    acceptOrder(@Param('id') id: string, @Request() req) {
        return this.ordersService.accept(id, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id/reject')
    @ApiOperation({ summary: 'Reject an order (driver only)' })
    @ApiBody({
        schema: {
            example: { reason: 'Capacidade insuficiente' },
        },
    })
    rejectOrder(@Param('id') id: string, @Body() body: { reason?: string }, @Request() req) {
        return this.ordersService.reject(id, req.user.userId, body.reason);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id/cancel')
    @ApiOperation({ summary: 'Cancel an order' })
    @ApiBody({
        schema: {
            example: { reason: 'Motivo do cancelamento' },
        },
    })
    cancelOrder(@Param('id') id: string, @Body() body: { reason?: string }, @Request() req) {
        return this.ordersService.cancel(id, req.user.userId, body.reason);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id/start')
    @ApiOperation({ summary: 'Start order progress (driver only)' })
    startProgress(@Param('id') id: string, @Request() req) {
        return this.ordersService.startProgress(id, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id/complete')
    @ApiOperation({ summary: 'Complete an order (driver only)' })
    @ApiBody({
        schema: {
            example: { finalPrice: 80.00 },
        },
    })
    completeOrder(@Param('id') id: string, @Body() body: { finalPrice?: number }, @Request() req) {
        return this.ordersService.complete(id, req.user.userId, body.finalPrice);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id/reopen')
    @ApiOperation({ summary: 'Reopen a cancelled order (customer only)' })
    reopenOrder(@Param('id') id: string, @Request() req) {
        return this.ordersService.reopen(id, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    @ApiOperation({ summary: 'Get order details' })
    findOne(@Param('id') id: string, @Request() req) {
        return this.ordersService.findOne(id, req.user.userId);
    }
}

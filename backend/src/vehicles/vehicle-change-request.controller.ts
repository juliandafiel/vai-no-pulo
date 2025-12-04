import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Delete,
    UseGuards,
    Request,
    Query,
} from '@nestjs/common';
import { VehicleChangeRequestService } from './vehicle-change-request.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('vehicle-change-requests')
@ApiBearerAuth()
@Controller('vehicle-change-requests')
export class VehicleChangeRequestController {
    constructor(private readonly changeRequestService: VehicleChangeRequestService) { }

    // Motorista cria solicitação de alteração
    @UseGuards(AuthGuard('jwt'))
    @Post()
    @ApiOperation({ summary: 'Criar solicitação de alteração de veículo' })
    create(@Body() createDto: any, @Request() req) {
        return this.changeRequestService.create(req.user.userId, createDto);
    }

    // Motorista lista suas solicitações
    @UseGuards(AuthGuard('jwt'))
    @Get('my-requests')
    @ApiOperation({ summary: 'Listar minhas solicitações de alteração' })
    findMyRequests(@Request() req) {
        return this.changeRequestService.findByDriver(req.user.userId);
    }

    // Admin lista todas as solicitações pendentes
    @UseGuards(AuthGuard('jwt'))
    @Get('pending')
    @ApiOperation({ summary: 'Listar solicitações pendentes (Admin)' })
    findPending() {
        return this.changeRequestService.findAllPending();
    }

    // Admin lista todas as solicitações com filtro opcional
    @UseGuards(AuthGuard('jwt'))
    @Get()
    @ApiOperation({ summary: 'Listar todas as solicitações (Admin)' })
    @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
    findAll(@Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
        return this.changeRequestService.findAll(status);
    }

    // Obter detalhes de uma solicitação
    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    @ApiOperation({ summary: 'Obter detalhes de uma solicitação' })
    findOne(@Param('id') id: string) {
        return this.changeRequestService.findOne(id);
    }

    // Admin aprova solicitação
    @UseGuards(AuthGuard('jwt'))
    @Patch(':id/approve')
    @ApiOperation({ summary: 'Aprovar solicitação de alteração (Admin)' })
    approve(
        @Param('id') id: string,
        @Body() body: { message?: string },
        @Request() req,
    ) {
        return this.changeRequestService.review(id, req.user.userId, {
            status: 'APPROVED',
            adminMessage: body.message,
        });
    }

    // Admin rejeita solicitação
    @UseGuards(AuthGuard('jwt'))
    @Patch(':id/reject')
    @ApiOperation({ summary: 'Rejeitar solicitação de alteração (Admin)' })
    reject(
        @Param('id') id: string,
        @Body() body: { rejectionReason: string },
        @Request() req,
    ) {
        return this.changeRequestService.review(id, req.user.userId, {
            status: 'REJECTED',
            rejectionReason: body.rejectionReason,
        });
    }

    // Motorista cancela sua solicitação
    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    @ApiOperation({ summary: 'Cancelar solicitação de alteração' })
    cancel(@Param('id') id: string, @Request() req) {
        return this.changeRequestService.cancel(id, req.user.userId);
    }

    // Verificar se veículo tem solicitação pendente
    @UseGuards(AuthGuard('jwt'))
    @Get('vehicle/:vehicleId/has-pending')
    @ApiOperation({ summary: 'Verificar se veículo tem solicitação pendente' })
    hasPending(@Param('vehicleId') vehicleId: string) {
        return this.changeRequestService.hasPendingRequest(vehicleId);
    }
}

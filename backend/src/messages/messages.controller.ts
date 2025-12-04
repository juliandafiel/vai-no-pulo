import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    @ApiOperation({ summary: 'Send a message in order chat' })
    @ApiBody({
        schema: {
            example: {
                orderId: 'uuid-do-pedido',
                driverId: 'uuid-do-motorista (opcional, necessário para cliente em pedidos avulsos)',
                content: 'Ola, tenho interesse no seu percurso!',
            },
        },
    })
    create(
        @Body() createMessageDto: { orderId: string; driverId?: string; content: string },
        @Request() req
    ) {
        console.log('[MessagesController.create] userId:', req.user.userId, 'orderId:', createMessageDto.orderId, 'driverId:', createMessageDto.driverId);
        return this.messagesService.create(createMessageDto, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('conversations')
    @ApiOperation({ summary: 'Get all conversations for the user' })
    getConversations(@Request() req) {
        console.log('[MessagesController.getConversations] userId:', req.user.userId);
        return this.messagesService.getConversations(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('unread-count')
    @ApiOperation({ summary: 'Get count of unread messages' })
    getUnreadCount(@Request() req) {
        return this.messagesService.countUnread(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('order/:orderId')
    @ApiOperation({ summary: 'Get all messages for an order (with specific driver)' })
    @ApiQuery({ name: 'driverId', required: false, description: 'ID do motorista para conversas específicas' })
    getOrderMessages(
        @Param('orderId') orderId: string,
        @Query('driverId') driverId: string,
        @Request() req
    ) {
        console.log('[MessagesController.getOrderMessages] userId:', req.user.userId, 'orderId:', orderId, 'driverId:', driverId);
        return this.messagesService.findByOrder(orderId, req.user.userId, driverId);
    }
}

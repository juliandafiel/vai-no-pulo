import { Controller, Get, Param, Patch, Put, Body, UseGuards, Request, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { MailService } from '../mail/mail.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly mailService: MailService,
    ) { }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    @ApiOperation({ summary: 'List all users (Admin)' })
    @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
    @ApiQuery({ name: 'role', required: false, enum: ['USER', 'DRIVER', 'ADMIN'] })
    async findAll(
        @Query('status') status?: string,
        @Query('role') role?: string,
    ) {
        return this.usersService.findAll(status, role);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID (Admin)' })
    async findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id/approve')
    @ApiOperation({ summary: 'Approve user profile (Admin)' })
    async approve(@Param('id') id: string, @Request() req) {
        const user = await this.usersService.approve(id, req.user.userId);

        // Envia email de aprovação
        await this.mailService.sendProfileApprovedEmail(user.email, user.name);

        return {
            success: true,
            message: 'Usuário aprovado com sucesso',
            user,
        };
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id/reject')
    @ApiOperation({ summary: 'Reject user profile (Admin)' })
    async reject(
        @Param('id') id: string,
        @Body() body: { reason: string },
        @Request() req,
    ) {
        const user = await this.usersService.reject(id, body.reason, req.user.userId);

        // Envia email de rejeição
        await this.mailService.sendProfileRejectedEmail(user.email, user.name, body.reason);

        return {
            success: true,
            message: 'Usuário rejeitado',
            user,
        };
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('pending/count')
    @ApiOperation({ summary: 'Count pending users (Admin)' })
    async countPending() {
        return this.usersService.countPending();
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('profile')
    @ApiOperation({ summary: 'Update user profile' })
    @ApiBody({
        schema: {
            example: {
                name: 'João Silva',
                birthDate: '01/01/1990',
                profilePhoto: 'data:image/jpeg;base64,...',
            },
        },
    })
    async updateProfile(
        @Body() body: { name?: string; birthDate?: string; profilePhoto?: string },
        @Request() req,
    ) {
        return this.usersService.updateProfile(req.user.userId, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('push-token')
    @ApiOperation({ summary: 'Update user push notification token' })
    @ApiBody({
        schema: {
            example: {
                pushToken: 'ExponentPushToken[xxxxxx]',
            },
        },
    })
    async updatePushToken(
        @Body() body: { pushToken: string | null },
        @Request() req,
    ) {
        return this.usersService.updatePushToken(req.user.userId, body.pushToken);
    }
}

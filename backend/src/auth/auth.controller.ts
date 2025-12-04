import { Controller, Request, Post, UseGuards, Body, Get, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Login user' })
    @ApiBody({ schema: { example: { email: 'test@example.com', password: 'password' } } })
    async login(@Body() req) {
        const user = await this.authService.validateUser(req.email, req.password);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset' })
    async forgotPassword(@Body() body: { email: string }) {
        return this.authService.forgotPassword(body.email);
    }

    @Post('register')
    @ApiOperation({ summary: 'Register user' })
    async register(@Body() body) {
        return this.authService.register(body);
    }

    @Get('profile')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user profile' })
    getProfile(@Request() req) {
        return req.user;
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Login with Google' })
    async googleAuth() {
        // Guard redirects to Google
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Google OAuth callback' })
    async googleAuthRedirect(@Request() req) {
        return this.authService.login(req.user);
    }

    @Post('send-verification')
    @ApiOperation({
        summary: 'Send verification code via email and/or SMS',
        description: 'At least one method (email or phone) must be provided. The code will be sent via all provided methods.'
    })
    @ApiBody({
        schema: {
            example: {
                email: 'user@example.com',
                phone: '(11) 9 1234-5678'
            },
            description: 'Email and phone are both optional, but at least one must be provided'
        }
    })
    async sendVerification(@Body() body: { email?: string; phone?: string }) {
        return this.authService.sendVerificationCode(body.email, body.phone);
    }

    @Post('verify-code')
    @ApiOperation({
        summary: 'Verify code sent via email or SMS',
        description: 'Provide the email or phone number used to receive the code, along with the 6-digit code'
    })
    @ApiBody({
        schema: {
            example: {
                emailOrPhone: 'user@example.com',
                code: '123456'
            },
            description: 'Use the same email or phone that received the verification code'
        }
    })
    async verifyCode(@Body() body: { emailOrPhone: string; code: string }) {
        return this.authService.verifyCode(body.emailOrPhone, body.code);
    }

    @Post('register/customer')
    @ApiOperation({ summary: 'Register customer' })
    async registerCustomer(@Body() body) {
        return this.authService.registerCustomer(body);
    }

    @Post('register/driver')
    @ApiOperation({ summary: 'Register driver' })
    async registerDriver(@Body() body) {
        return this.authService.registerDriver(body);
    }

    @Post('check-email')
    @ApiOperation({ summary: 'Check if email is already registered' })
    @ApiBody({
        schema: {
            example: { email: 'user@example.com' },
        },
    })
    async checkEmail(@Body() body: { email: string }) {
        return this.authService.checkEmailExists(body.email);
    }

    @Put('documents')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update user documents (CNH front and back)' })
    @ApiBody({
        schema: {
            example: {
                documentType: 'CNH',
                documentFront: '/uploads/documents/front.jpg',
                documentBack: '/uploads/documents/back.jpg',
            },
        },
    })
    async updateDocuments(
        @Request() req,
        @Body() body: { documentType: string; documentFront: string; documentBack: string },
    ) {
        // req.user.userId vem do JwtStrategy.validate()
        return this.authService.updateDocuments(req.user.userId, body);
    }
}

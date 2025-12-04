import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from '../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private usersService: UsersService) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { id, name, emails } = profile;
        const email = emails[0].value;

        let user = await this.usersService.findByGoogleId(id);

        if (!user) {
            user = await this.usersService.findOne(email);
            if (user) {
                // Link Google account to existing user
                user = await this.usersService.updateGoogleId(user.id, id);
            } else {
                // Create new user
                user = await this.usersService.createFromGoogle({
                    googleId: id,
                    email,
                    name: name.givenName + ' ' + name.familyName,
                    verifiedEmail: true,
                });
            }
        }

        done(null, user);
    }
}

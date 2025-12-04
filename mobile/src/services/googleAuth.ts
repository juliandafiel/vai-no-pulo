import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = 'your-google-client-id.apps.googleusercontent.com';
const BACKEND_URL = 'http://192.168.3.110:3000';

export const useGoogleAuth = () => {
    const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
    };

    const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'vai-no-pulo',
        path: 'redirect',
    });

    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: GOOGLE_CLIENT_ID,
            scopes: ['openid', 'profile', 'email'],
            redirectUri,
        },
        discovery,
    );

    return {
        request,
        response,
        promptAsync,
    };
};

export const signInWithGoogle = async () => {
    try {
        // For now, we'll just open the backend Google auth endpoint
        const result = await WebBrowser.openAuthSessionAsync(
            `${BACKEND_URL}/auth/google`,
            'vai-no-pulo://redirect',
        );

        if (result.type === 'success' && result.url) {
            // Extract token from URL
            const url = new URL(result.url);
            const accessToken = url.searchParams.get('access_token');
            return accessToken;
        }
        return null;
    } catch (error) {
        console.error('Google Sign-In Error:', error);
        return null;
    }
};

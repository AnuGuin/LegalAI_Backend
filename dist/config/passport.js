import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import prisma from './database.js';
// JWT Strategy
passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
}, async (payload, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                provider: true,
            },
        });
        if (!user) {
            return done(null, false);
        }
        return done(null, user);
    }
    catch (error) {
        return done(error, false);
    }
}));
// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { providerId: profile.id, provider: 'GOOGLE' },
                    { email: profile.emails?.[0]?.value },
                ],
            },
        });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: profile.emails?.[0]?.value || '',
                    name: profile.displayName,
                    avatar: profile.photos?.[0]?.value,
                    provider: 'GOOGLE',
                    providerId: profile.id,
                },
            });
        }
        else if (!user.providerId) {
            // Link existing local account with Google
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    provider: 'GOOGLE',
                    providerId: profile.id,
                    avatar: profile.photos?.[0]?.value,
                },
            });
        }
        return done(null, user);
    }
    catch (error) {
        return done(error, undefined);
    }
}));
// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.META_APP_ID,
    clientSecret: process.env.META_APP_SECRET,
    callbackURL: process.env.META_CALLBACK_URL,
    profileFields: ['id', 'emails', 'name', 'picture'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { providerId: profile.id, provider: 'META' },
                    { email: profile.emails?.[0]?.value },
                ],
            },
        });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: profile.emails?.[0]?.value || '',
                    name: `${profile.name?.givenName} ${profile.name?.familyName}`,
                    avatar: profile.photos?.[0]?.value,
                    provider: 'META',
                    providerId: profile.id,
                },
            });
        }
        return done(null, user);
    }
    catch (error) {
        return done(error, undefined);
    }
}));
export default passport;
//# sourceMappingURL=passport.js.map
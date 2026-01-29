import { Request, Response } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro';

export class AuthController {
    // Social Login (Google)
    static async socialLogin(req: Request, res: Response): Promise<void> {
        console.log('🔐 Social Login >> Request received');
        console.log('🔐 Social Login >> Body:', JSON.stringify(req.body, null, 2));

        try {
            const { email, googleId, firstName, lastName, photoUrl } = req.body;

            console.log('🔐 Social Login >> Email:', email);
            console.log('🔐 Social Login >> Google ID:', googleId);
            console.log('🔐 Social Login >> Name:', firstName, lastName);

            if (!email) {
                console.log('❌ Social Login >> Email is missing');
                res.status(400).json({ message: 'Email is required' });
                return;
            }

            // 1. Check if user exists
            console.log('🔍 Social Login >> Searching for user with email:', email);
            let user = await User.findOne({ where: { email } });

            if (user) {
                console.log('✅ Social Login >> User found:', user.id);

                // Check if user is blocked
                if (user.is_blocked) {
                    console.log('❌ Social Login >> User is blocked:', user.email);
                    res.status(403).json({ message: 'Account has been blocked. Please contact support.' });
                    return;
                }

                // 2. If exists, update google_id if missing (Link Account)
                if (!user.google_id) {
                    console.log('🔗 Social Login >> Linking Google account to existing user');
                    user.google_id = googleId;
                    user.auth_provider = user.auth_provider === 'local' ? 'local_and_google' : 'google';
                    await user.save();
                    console.log('✅ Social Login >> Google account linked successfully');
                }

                // Update last login
                user.last_login = new Date();
                await user.save();
            } else {
                // 3. If new, create user with Google data
                console.log('➕ Social Login >> Creating new user');
                user = await User.create({
                    email,
                    google_id: googleId,
                    first_name: firstName || 'Usuario',
                    last_name: lastName || 'Google',
                    password_hash: crypto.randomBytes(32).toString('hex'), // Random secure string
                    auth_provider: 'google',
                    role: 'customer',
                    last_login: new Date()
                });
                console.log('✅ Social Login >> New user created:', user.id);
            }

            // 4. Generate Token
            console.log('🔑 Social Login >> Generating JWT token');
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            console.log('✅ Social Login >> Token generated successfully');
            console.log('✅ Social Login >> Sending success response');

            res.json({
                message: 'Login successful',
                accessToken: token,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.first_name,
                    role: user.role,
                    photo: photoUrl
                }
            });

        } catch (error) {
            console.error('❌ Social Login Error:', error);
            console.error('❌ Social Login Error Stack:', error instanceof Error ? error.stack : 'No stack trace');
            res.status(500).json({ message: 'Error processing social login', error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
}

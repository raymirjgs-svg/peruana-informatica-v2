import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import apiClient from '@/utils/api';

declare module "next-auth" {
    interface User {
        id: string;
        token: string;
        username: string;
        role: string;
    }

    interface Session {
        user: User;
        accessToken: string;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                username: { label: "Email", type: "email" },
                password: { label: "Contraseña", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials?.email || credentials?.username;
                if (!email || !credentials?.password) return null;

                try {
                    const data = await apiClient.request<{
                        accessToken?: string;
                        user?: { id?: string | number; username?: string; email?: string; role?: string };
                    }>('/api/auth/login', {
                        method: 'POST',
                        body: { email, password: credentials.password },
                    });

                    if (data.accessToken) {
                        return {
                            id: String(data.user?.id || "1"),
                            username: String(data.user?.username || data.user?.email?.split('@')[0] || email.split('@')[0]),
                            token: data.accessToken,
                            role: data.user?.role || 'customer'
                        };
                    }

                    return null;
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    debug: false, // Disable debug mode to prevent logging errors
    logger: {
        error: () => { }, // Disable error logging
        warn: () => { },  // Disable warning logging
        debug: () => { }  // Disable debug logging
    },
    pages: {
        signIn: "/admin/login",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                try {
                    const data = await apiClient.request<{
                        accessToken?: string;
                        user: { id: string | number; username: string; role: string };
                    }>('/api/auth/social-login', {
                        method: 'POST',
                        body: {
                            email: user.email,
                            googleId: account.providerAccountId,
                            firstName: profile?.name?.split(" ")[0] || "Usuario",
                            lastName: profile?.name?.split(" ").slice(1).join(" ") || "Google",
                            photoUrl: user.image
                        },
                    });

                    if (data.accessToken) {
                        // Attach backend token to user object for JWT callback
                        user.token = data.accessToken;
                        user.id = String(data.user.id);
                        user.username = data.user.username;
                        user.role = data.user.role;
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error("Social login error:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = user.token as string;
                token.username = user.username as string;
                token.role = user.role as string;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.accessToken = token.accessToken as string;
                session.user = {
                    ...session.user,
                    username: token.username as string,
                    role: token.role as string,
                };
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET,
};

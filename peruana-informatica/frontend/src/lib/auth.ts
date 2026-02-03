import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

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
                username: { label: "Email", type: "email" },
                password: { label: "Contraseña", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;

                try {
                    // Always query backend on port 3001
                    const apiBase = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

                    const res = await fetch(`${apiBase}/api/admin/login`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: credentials.username, // NextAuth uses 'username' field by default for the first credential
                            password: credentials.password,
                        }),
                    });

                    const data = await res.json();

                    if (res.ok && data.accessToken) { // Backend returns accessToken, not token
                        return {
                            id: data.user?.id || "1",
                            username: data.user?.username || data.user?.email.split('@')[0],
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
                    const apiBase = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

                    // Send Google data to backend to find/create user
                    const res = await fetch(`${apiBase}/api/auth/social-login`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: user.email,
                            googleId: account.providerAccountId,
                            firstName: profile?.name?.split(" ")[0] || "Usuario",
                            lastName: profile?.name?.split(" ").slice(1).join(" ") || "Google",
                            photoUrl: user.image
                        }),
                    });

                    const data = await res.json();

                    if (res.ok && data.accessToken) {
                        // Attach backend token to user object for JWT callback
                        user.token = data.accessToken;
                        user.id = data.user.id;
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

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime for NextAuth compatibility with Next.js 15
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

// Wrap handlers to catch errors gracefully
async function wrappedHandler(req: NextRequest, context: any) {
    try {
        return await handler(req, context);
    } catch (error) {
        // Return empty session on error to prevent client-side crashes
        console.error("[NextAuth] Error:", error);
        return NextResponse.json({ user: null, expires: "" }, { status: 200 });
    }
}

export { wrappedHandler as GET, wrappedHandler as POST };

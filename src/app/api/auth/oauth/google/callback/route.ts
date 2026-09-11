import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setAuthCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("error", "Google sign-in was cancelled or failed.");
      return NextResponse.redirect(loginUrl);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const origin = req.nextUrl.origin;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${origin}/api/auth/oauth/google/callback`;

    if (!clientId || !clientSecret) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("error", "Google authentication is not configured in environment variables.");
      return NextResponse.redirect(loginUrl);
    }

    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const tokenErr = await tokenRes.text();
      console.error("Google token exchange error:", tokenErr);
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("error", "Failed to exchange authorization code with Google.");
      return NextResponse.redirect(loginUrl);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("error", "Failed to fetch user profile from Google.");
      return NextResponse.redirect(loginUrl);
    }

    const googleUser = await userRes.json();
    const { email, given_name, family_name, picture } = googleUser;

    if (!email) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("error", "No email returned from Google account.");
      return NextResponse.redirect(loginUrl);
    }

    // 3. Find or create user in DB
    let user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Generate a unique username based on email/name
      const baseUsername = (given_name || email.split("@")[0]).toLowerCase().replace(/[^a-z0-9]/g, "");
      let username = baseUsername;
      let count = 1;
      while (await db.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${count++}`;
      }

      user = await db.user.create({
        data: {
          email: email.toLowerCase(),
          username,
          firstname: given_name || "User",
          lastname: family_name || "",
          password: `oauth_google_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          provider: "google",
          providerId: googleUser.id || googleUser.sub || null,
          role: "BUYER",
          status: 1, // Active
        },
      });
    } else if (user.status !== 1) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("error", "Your account has been suspended or deactivated.");
      return NextResponse.redirect(loginUrl);
    }

    // 4. Set JWT Auth Cookies
    const roleString = user.role as "BUYER" | "SELLER" | "ADMIN";
    await setAuthCookies({
      sub: user.id,
      email: user.email,
      role: roleString,
      username: user.username,
    });

    // 5. Redirect based on role
    const targetPath = user.role === "ADMIN" ? "/admin" : user.role === "SELLER" ? "/seller" : "/dashboard";
    return NextResponse.redirect(new URL(targetPath, req.nextUrl.origin));
  } catch (err) {
    console.error("Google OAuth Callback Error:", err);
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("error", "Internal server error during Google Sign-in.");
    return NextResponse.redirect(loginUrl);
  }
}

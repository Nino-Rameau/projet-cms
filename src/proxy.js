import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const authMiddleware = withAuth({
  pages: {
    signIn: "/", 
  }
});

export default function middleware(req, event) {
  const url = req.nextUrl;
  
  // 1. Logique Domaine Custom
  const hostname = req.headers.get("host") || "";
  const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1") || hostname.includes(":3000") || hostname.includes(":8080");
  const appDomain = process.env.APP_DOMAIN || "localhost";
  const isAppDomain = hostname === appDomain || hostname.endsWith(`.${appDomain}`);

  if (!isLocalhost && !isAppDomain && !url.pathname.startsWith('/view') && !url.pathname.startsWith('/domain') && !url.pathname.startsWith('/api') && !url.pathname.startsWith('/_next') && url.pathname !== '/favicon.ico') {
    // Rewrite vers la route domaine
    return NextResponse.rewrite(new URL(`/domain/${hostname}${url.pathname === '/' ? '/home' : url.pathname}`, req.url));
  }

  // 2. Logique NextAuth sur les routes privées
  if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/editor')) {
    return authMiddleware(req, event);
  }

  return NextResponse.next();
}

export const config = {
  // On intercepte TOUT sauf les statiques pour pouvoir checker le domaine
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};

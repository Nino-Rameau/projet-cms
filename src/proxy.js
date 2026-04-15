import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/", 
  },
});

export const config = {
  // Routes protégées: tout dashboard et editor
  matcher: ["/dashboard/:path*", "/editor/:path*"],
};

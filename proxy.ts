import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth(function proxy(req) {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/"],
};

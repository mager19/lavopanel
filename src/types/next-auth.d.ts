import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "owner" | "worker";
    } & DefaultSession["user"];
  }

  interface User {
    role: "admin" | "owner" | "worker";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "owner" | "worker";
  }
}

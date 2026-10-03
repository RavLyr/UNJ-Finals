import type { DefaultSession } from "next-auth";
import type { User as DomainUser } from "@/lib/types";

declare module "next-auth" {
  interface User {
    role?: DomainUser["role"];
  }
  interface Session {
    user: DefaultSession["user"] & { id: string; role: DomainUser["role"] };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: DomainUser["role"];
  }
}

import { env } from "@/env";
import jwt from "jsonwebtoken";

export function issueJwt(id: string): string {
  return jwt.sign(id, env.SECRET);
}

export function verifyjwt(token: string): string {
  return jwt.verify(token, env.SECRET) as string;
}

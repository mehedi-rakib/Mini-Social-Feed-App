import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../lib/env.js";
import { ApiError } from "../../utils/ApiError.js";
import type { SignupInput, LoginInput } from "./auth.schema.js";

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, username: user.username, email: user.email, displayName: user.displayName };
}

function signToken(id: string, username: string): string {
  return jwt.sign({ id, username }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: "HS256",
  } as jwt.SignOptions);
}

export async function signup(input: SignupInput) {
  const usernameLower = input.username.toLowerCase();
  const emailLower = input.email.toLowerCase();

  const [usernameTaken, emailTaken] = await Promise.all([
    prisma.user.findUnique({ where: { usernameLower } }),
    prisma.user.findUnique({ where: { emailLower } }),
  ]);

  if (usernameTaken) {
    throw new ApiError("CONFLICT", "Username is already taken");
  }
  if (emailTaken) {
    throw new ApiError("CONFLICT", "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      usernameLower,
      email: input.email,
      emailLower,
      passwordHash,
      displayName: input.displayName ?? input.username,
    },
  });

  const token = signToken(user.id, user.username);
  return { token, user: toPublicUser(user) };
}

export async function login(input: LoginInput) {
  const emailLower = input.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { emailLower } });

  const invalidCredentials = () => new ApiError("UNAUTHORIZED", "Invalid email or password");

  if (!user) {
    throw invalidCredentials();
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw invalidCredentials();
  }

  const token = signToken(user.id, user.username);
  return { token, user: toPublicUser(user) };
}

export async function getUserById(id: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError("NOT_FOUND", "User not found");
  }
  return toPublicUser(user);
}

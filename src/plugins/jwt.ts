import jwt from "@fastify/jwt";
import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";

export const registerJwt = fp(
  async (app: FastifyInstance) => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(
        "JWT_SECRET is not defined",
      );
    }

    await app.register(jwt, {
      secret,
      sign: {
        expiresIn:
          process.env.JWT_EXPIRES_IN || "1d",
      },
    });
  },
  {
    name: "inventory-jwt",
  },
);
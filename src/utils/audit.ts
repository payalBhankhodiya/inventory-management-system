import type { FastifyRequest } from "fastify";

export function getAuditRequestInfo(
  request: FastifyRequest,
) {
  return {
    ipAddress: request.ip,
    userAgent:
      request.headers["user-agent"] ?? null,
  };
}
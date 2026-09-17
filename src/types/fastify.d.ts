import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      userId: string;
      organizationId: string;
      roleId: string;
      roleName: string;
    };

    user: {
      userId: string;
      organizationId: string;
      roleId: string;
      roleName: string;
    };
  }
}
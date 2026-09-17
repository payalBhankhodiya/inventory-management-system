import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createStockTransactionSchema,
  deleteStockTransactionResponseSchema,
  stockTransactionErrorResponseSchema,
  stockTransactionIdParamSchema,
  stockTransactionSingleResponseSchema,
  stockTransactionsListQuerySchema,
  stockTransactionsListResponseSchema,
} from "./stock-transaction.schema.js";

import {
  createStockTransaction,
  deleteStockTransaction,
  getStockTransactionById,
  getStockTransactions,
} from "./stock-transaction.service.js";

export const stockTransactionRoutes = async (
  app: FastifyInstance,
) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Stock Transactions"],
        querystring: stockTransactionsListQuerySchema,
        response: {
          200: stockTransactionsListResponseSchema,
          400: stockTransactionErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await getStockTransactions(
          request.user.organizationId,
          request.query,
        );

        return reply.send({
          success: true,
          message:
            "Stock transactions fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch stock transactions",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Stock Transactions"],
        params: stockTransactionIdParamSchema,
        response: {
          200: stockTransactionSingleResponseSchema,
          400: stockTransactionErrorResponseSchema,
          404: stockTransactionErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const transaction =
          await getStockTransactionById(
            request.user.organizationId,
            request.params.id,
          );

        return reply.send({
          success: true,
          message:
            "Stock transaction fetched successfully",
          data: transaction,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Stock transaction not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Stock Transactions"],
        body: createStockTransactionSchema,
        response: {
          201: stockTransactionSingleResponseSchema,
          400: stockTransactionErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const transaction =
          await createStockTransaction(request.body);

        return reply.status(201).send({
          success: true,
          message:
            "Stock transaction created successfully",
          data: transaction,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create stock transaction",
        });
      }
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Stock Transactions"],
        params: stockTransactionIdParamSchema,
        response: {
          200: deleteStockTransactionResponseSchema,
          400: stockTransactionErrorResponseSchema,
          404: stockTransactionErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteStockTransaction(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message:
            "Stock transaction deleted successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete stock transaction",
        });
      }
    },
  );
};
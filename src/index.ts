import "dotenv/config";

import { buildApp } from "./app.js";

const start = async () => {
  try {
    const app = await buildApp();

    await app.ready();

    console.log("\nRegistered Routes:");
    console.log(app.printRoutes());

    await app.listen({
      port: Number(process.env.PORT) || 5000,
      host: process.env.HOST || "0.0.0.0",
    });

    console.log(
      `Server running on http://localhost:${Number(process.env.PORT) || 5000}`,
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

start();
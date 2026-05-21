import "dotenv/config";
import { defineConfig } from "prisma/config";

const config: any = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
};

if (process.env.DATABASE_URL) {
  config.datasource = {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  };
}

export default defineConfig(config);

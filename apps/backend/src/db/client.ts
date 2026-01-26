import postgres, { type Sql } from "postgres";

let client: Sql | null = null;

export const getDb = (): Sql => {
  if (client) {
    return client;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    const error = new Error("DATABASE_URL is not set");
    (error as Error & { statusCode?: number }).statusCode = 500;
    throw error;
  }

  client = postgres(connectionString, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return client;
};

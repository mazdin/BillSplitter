import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL?.trim().replace(/\/$/, "");

export const db = createClient({
  url: url,
  authToken: process.env.TURSO_AUTH_TOKEN?.trim(),
});

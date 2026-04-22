import { createClient } from '@libsql/client';

const rawUrl = process.env.TURSO_DATABASE_URL?.trim() || '';
const url = rawUrl.replace(/^(libsql|wss):\/\//, "https://").replace(/\/$/, "");

export const db = createClient({
  url: url,
  authToken: process.env.TURSO_AUTH_TOKEN?.trim(),
});

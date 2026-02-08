export const CREATE_ORDERS_TABLE = `
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY NOT NULL,
  clientId TEXT NOT NULL,
  clientEmail TEXT NOT NULL,
  status TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);
`;

export const CREATE_PRODUCTS_TABLE = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  prices TEXT NOT NULL,
  unit TEXT NOT NULL,
  category TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  localImagePath TEXT,
  imageLastUpdated INTEGER,
  isDeleted INTEGER DEFAULT 0
);
`;

export const CREATE_METADATA_TABLE = `
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

export const CREATE_PRICE_TYPES_TABLE = `
CREATE TABLE IF NOT EXISTS price_types (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  isDeleted INTEGER DEFAULT 0
);
`;

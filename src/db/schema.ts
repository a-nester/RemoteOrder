export const CREATE_ORDERS_TABLE = `
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY NOT NULL,
  date TEXT NOT NULL,
  counterpartyId TEXT NOT NULL,
  counterpartyName TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER,
  clientId TEXT,
  clientEmail TEXT,
  comment TEXT,
  isDraft INTEGER DEFAULT 0
);
`;

export const CREATE_ORDER_ITEMS_TABLE = `
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY NOT NULL,
  orderId TEXT NOT NULL,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  quantity REAL NOT NULL,
  price REAL NOT NULL,
  unit TEXT NOT NULL,
  total REAL NOT NULL,
  FOREIGN KEY(orderId) REFERENCES orders(id) ON DELETE CASCADE
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

export const CREATE_COUNTERPARTIES_TABLE = `
CREATE TABLE IF NOT EXISTS counterparties (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  contactPerson TEXT,
  isBuyer INTEGER DEFAULT 0,
  isSeller INTEGER DEFAULT 0,
  priceTypeId TEXT,
  groupId TEXT,
  createdAt INTEGER,
  updatedAt INTEGER,
  isDeleted INTEGER DEFAULT 0
);
`;

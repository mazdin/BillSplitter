-- Schema for Bill Splitter App

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    tax_type TEXT DEFAULT 'percentage', -- 'percentage' or 'fixed'
    tax_value REAL DEFAULT 0,
    service_charge REAL DEFAULT 0,
    rounding_type TEXT DEFAULT 'none', -- 'ceil', 'floor', 'nearest'
    rounding_value INTEGER DEFAULT 0 -- 0, 500, 1000
);

CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS item_assignments (
    item_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    PRIMARY KEY (item_id, member_id),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

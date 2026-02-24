PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS llc_entities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('HOLDING','CHILD')),
  parent_id INTEGER,
  legal_name TEXT NOT NULL,
  ein_placeholder TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(parent_id) REFERENCES llc_entities(id)
);

CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_llc_id INTEGER NOT NULL,
  address TEXT NOT NULL,
  county TEXT,
  acquisition_date TEXT NOT NULL,
  purchase_price REAL,
  notes TEXT,
  FOREIGN KEY(child_llc_id) REFERENCES llc_entities(id)
);

CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  unit_label TEXT NOT NULL,
  beds REAL,
  baths REAL,
  FOREIGN KEY(property_id) REFERENCES properties(id)
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_llc_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  last4 TEXT,
  is_escrow INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(child_llc_id) REFERENCES llc_entities(id)
);

CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_llc_id INTEGER NOT NULL,
  account_type TEXT NOT NULL,
  name TEXT NOT NULL,
  schedule_e_bucket TEXT,
  is_system INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(child_llc_id) REFERENCES llc_entities(id)
);

CREATE TABLE IF NOT EXISTS vendors (id INTEGER PRIMARY KEY AUTOINCREMENT, child_llc_id INTEGER, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tenants (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT, phone TEXT);
CREATE TABLE IF NOT EXISTS property_managers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT, phone TEXT);

CREATE TABLE IF NOT EXISTS leases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  rent_amount REAL NOT NULL,
  due_day INTEGER NOT NULL DEFAULT 1,
  late_fee_rules TEXT,
  FOREIGN KEY(unit_id) REFERENCES units(id),
  FOREIGN KEY(tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  payee TEXT,
  memo TEXT,
  amount REAL NOT NULL,
  child_llc_id INTEGER NOT NULL,
  property_id INTEGER NOT NULL,
  unit_id INTEGER,
  shared_flag INTEGER NOT NULL DEFAULT 0,
  bank_account_id INTEGER,
  status TEXT NOT NULL CHECK(status IN ('UNPOSTED','POSTED')) DEFAULT 'UNPOSTED',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transaction_splits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  memo TEXT,
  unit_id INTEGER,
  shared_flag INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(transaction_id) REFERENCES transactions(id),
  FOREIGN KEY(account_id) REFERENCES chart_of_accounts(id)
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_llc_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  memo TEXT,
  source_type TEXT,
  source_id INTEGER
);

CREATE TABLE IF NOT EXISTS journal_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_entry_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  debit REAL NOT NULL DEFAULT 0,
  credit REAL NOT NULL DEFAULT 0,
  property_id INTEGER NOT NULL,
  unit_id INTEGER,
  shared_flag INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(journal_entry_id) REFERENCES journal_entries(id),
  FOREIGN KEY(account_id) REFERENCES chart_of_accounts(id)
);

CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_deposits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lease_id INTEGER NOT NULL,
  bank_account_id INTEGER NOT NULL,
  received REAL NOT NULL DEFAULT 0,
  deductions REAL NOT NULL DEFAULT 0,
  refunded REAL NOT NULL DEFAULT 0,
  balance REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_llc_id INTEGER NOT NULL,
  property_id INTEGER NOT NULL,
  lender TEXT NOT NULL,
  principal REAL NOT NULL,
  rate REAL NOT NULL,
  start_date TEXT NOT NULL,
  escrow_flag INTEGER NOT NULL DEFAULT 0,
  pmi_flag INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS loan_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  total REAL NOT NULL,
  principal REAL NOT NULL,
  interest REAL NOT NULL,
  escrow REAL NOT NULL DEFAULT 0,
  pmi REAL NOT NULL DEFAULT 0,
  late_fee REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fixed_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_llc_id INTEGER NOT NULL,
  property_id INTEGER NOT NULL,
  unit_id INTEGER,
  shared_flag INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  placed_in_service_date TEXT NOT NULL,
  cost REAL NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS depreciation_rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fixed_asset_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  amount REAL NOT NULL,
  FOREIGN KEY(fixed_asset_id) REFERENCES fixed_assets(id)
);

CREATE TABLE IF NOT EXISTS bank_import_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_account_id INTEGER NOT NULL,
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source_file TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bank_import_rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  fit_id TEXT,
  matched_transaction_id INTEGER,
  FOREIGN KEY(batch_id) REFERENCES bank_import_batches(id)
);

CREATE TABLE IF NOT EXISTS rules_engine (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_llc_id INTEGER NOT NULL,
  match_type TEXT NOT NULL,
  pattern TEXT NOT NULL,
  account_id INTEGER,
  property_id INTEGER,
  unit_id INTEGER,
  shared_flag INTEGER NOT NULL DEFAULT 0,
  vendor_id INTEGER,
  confidence REAL NOT NULL DEFAULT 0.5
);

CREATE TABLE IF NOT EXISTS reconciliations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_account_id INTEGER NOT NULL,
  statement_end_date TEXT NOT NULL,
  statement_ending_balance REAL NOT NULL,
  cleared_total REAL NOT NULL,
  difference REAL NOT NULL,
  closed_flag INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  before_json TEXT,
  after_json TEXT
);

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  accounting_basis TEXT NOT NULL DEFAULT 'CASH',
  setup_complete INTEGER NOT NULL DEFAULT 0,
  short_term_module INTEGER NOT NULL DEFAULT 0,
  pm_module INTEGER NOT NULL DEFAULT 0,
  depreciation_module INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO app_settings(id) VALUES(1);

#!/usr/bin/env python3
"""
PostgreSQL Transaction Data Generator (Docker Version)
====================================================
Seeds data directly into the Docker PostgreSQL instance on port 5433.
"""

import psycopg2
from psycopg2 import sql
from io import StringIO
import random
import string
import time
from datetime import datetime, timedelta
from typing import Generator, List, Tuple
import sys

# =============================================================================
# DATABASE CONFIGURATION - DOCKER
# =============================================================================
DB_NAME = "datastuff"
DB_USER = "postgres"
DB_PASSWORD = "Password"
DB_HOST = "localhost"
DB_PORT = 5433  # Port mapped to Docker

# =============================================================================
# DATA GENERATION CONFIGURATION (Reduced for speed during setup)
# =============================================================================
NUM_CUSTOMERS = 100_000      # 100K customers
NUM_MERCHANTS = 10_000       # 10K merchants
NUM_TRANSACTIONS = 1_000_000 # 1M transactions (enough for benchmark)

BATCH_SIZE = 50_000

# Realistic data pools
FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
    "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Lisa", "Daniel", "Nancy",
    "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
    "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
    "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
    "Timothy", "Deborah", "Ronald", "Stephanie", "Edward", "Rebecca", "Jason", "Sharon"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell"
]

EMAIL_DOMAINS = [
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
    "protonmail.com", "mail.com", "aol.com", "zoho.com", "fastmail.com"
]

MERCHANT_PREFIXES = [
    "Super", "Mega", "Quick", "Prime", "Golden", "Royal", "Elite", "Pro",
    "Smart", "Express", "Flash", "Ultra", "Max", "Plus", "Star", "Best"
]

MERCHANT_SUFFIXES = [
    "Mart", "Store", "Shop", "Outlet", "Hub", "Center", "Place", "Market",
    "Zone", "Depot", "World", "Plaza", "Corner", "Stop", "Point", "Base"
]

MERCHANT_CATEGORIES = [
    "Grocery", "Electronics", "Clothing", "Restaurant", "Gas Station",
    "Entertainment", "Healthcare", "Travel", "Utilities", "Insurance",
    "Education", "Home Improvement", "Automotive", "Sports", "Beauty",
    "Books", "Pet Supplies", "Jewelry", "Office Supplies", "Subscription"
]

TRANSACTION_STATUSES = ["completed", "pending", "failed", "refunded", "cancelled"]
STATUS_WEIGHTS = [0.85, 0.05, 0.03, 0.05, 0.02]


def get_connection():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.autocommit = False
        return conn
    except psycopg2.Error as e:
        print(f"❌ Failed to connect to database: {e}")
        sys.exit(1)


def create_tables(conn):
    print("\n📋 Creating tables...")
    cursor = conn.cursor()
    cursor.execute("""
        DROP TABLE IF EXISTS transactions CASCADE;
        DROP TABLE IF EXISTS customers CASCADE;
        DROP TABLE IF EXISTS merchants CASCADE;
    """)
    cursor.execute("""
        CREATE TABLE customers (
            customer_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL
        );
    """)
    cursor.execute("""
        CREATE TABLE merchants (
            merchant_id SERIAL PRIMARY KEY,
            merchant_name VARCHAR(150) NOT NULL,
            category VARCHAR(50) NOT NULL,
            created_at TIMESTAMP NOT NULL
        );
    """)
    cursor.execute("""
        CREATE TABLE transactions (
            transaction_id SERIAL PRIMARY KEY,
            customer_id INTEGER NOT NULL,
            merchant_id INTEGER NOT NULL,
            amount DECIMAL(12, 2) NOT NULL,
            status VARCHAR(20) NOT NULL,
            transaction_time TIMESTAMP NOT NULL
        );
    """)
    conn.commit()
    print("   ✅ Tables created successfully")


def generate_random_email(first_name: str, last_name: str, customer_id: int) -> str:
    domain = random.choice(EMAIL_DOMAINS)
    separator = random.choice([".", "_", ""])
    number = random.randint(1, 9999) if random.random() > 0.5 else ""
    return f"{first_name.lower()}{separator}{last_name.lower()}{number}_{customer_id}@{domain}"


def generate_customers_batch(start_id: int, batch_size: int, base_date: datetime) -> StringIO:
    buffer = StringIO()
    for i in range(batch_size):
        customer_id = start_id + i
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        name = f"{first_name} {last_name}"
        email = generate_random_email(first_name, last_name, customer_id)
        days_ago = random.randint(0, 1825)
        created_at = base_date - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        buffer.write(f"{customer_id}\t{name}\t{email}\t{created_at}\n")
    buffer.seek(0)
    return buffer


def generate_merchants_batch(start_id: int, batch_size: int, base_date: datetime) -> StringIO:
    buffer = StringIO()
    for i in range(batch_size):
        merchant_id = start_id + i
        prefix = random.choice(MERCHANT_PREFIXES)
        suffix = random.choice(MERCHANT_SUFFIXES)
        unique_id = ''.join(random.choices(string.ascii_uppercase, k=3))
        merchant_name = f"{prefix} {suffix} {unique_id}"
        category = random.choice(MERCHANT_CATEGORIES)
        days_ago = random.randint(0, 1095)
        created_at = base_date - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        buffer.write(f"{merchant_id}\t{merchant_name}\t{category}\t{created_at}\n")
    buffer.seek(0)
    return buffer


def generate_transactions_batch(start_id: int, batch_size: int, num_customers: int, num_merchants: int, base_date: datetime) -> StringIO:
    buffer = StringIO()
    for i in range(batch_size):
        transaction_id = start_id + i
        customer_id = random.randint(1, num_customers)
        merchant_id = random.randint(1, num_merchants)
        amount_type = random.random()
        if amount_type < 0.6: amount = round(random.uniform(1.00, 50.00), 2)
        elif amount_type < 0.9: amount = round(random.uniform(50.00, 500.00), 2)
        else: amount = round(random.uniform(500.00, 5000.00), 2)
        status = random.choices(TRANSACTION_STATUSES, weights=STATUS_WEIGHTS)[0]
        days_ago = random.randint(0, 730)
        transaction_time = base_date - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59), seconds=random.randint(0, 59))
        buffer.write(f"{transaction_id}\t{customer_id}\t{merchant_id}\t{amount}\t{status}\t{transaction_time}\n")
    buffer.seek(0)
    return buffer


def bulk_insert_with_copy(conn, table_name: str, columns: List[str], generator_func, total_rows: int, **kwargs):
    cursor = conn.cursor()
    cursor.execute(f"ALTER TABLE {table_name} DISABLE TRIGGER ALL;")
    rows_inserted = 0
    print(f"\n📥 Inserting {total_rows:,} rows into {table_name}...")
    while rows_inserted < total_rows:
        batch_size = min(BATCH_SIZE, total_rows - rows_inserted)
        start_id = rows_inserted + 1
        buffer = generator_func(start_id, batch_size, **kwargs)
        cursor.copy_from(buffer, table_name, columns=columns, null='')
        rows_inserted += batch_size
        if rows_inserted % (total_rows // 10) < BATCH_SIZE or rows_inserted == total_rows:
            print(f"   ⏳ Progress: {rows_inserted:,}/{total_rows:,}")
    cursor.execute(f"ALTER TABLE {table_name} ENABLE TRIGGER ALL;")
    conn.commit()


def create_indexes_and_constraints(conn):
    print("\n🔧 Creating indexes and constraints...")
    cursor = conn.cursor()
    indexes = [
        ("idx_customers_email", "customers", "email"),
        ("idx_customers_created_at", "customers", "created_at"),
        ("idx_merchants_category", "merchants", "category"),
        ("idx_merchants_created_at", "merchants", "created_at"),
        ("idx_transactions_customer_id", "transactions", "customer_id"),
        ("idx_transactions_merchant_id", "transactions", "merchant_id"),
        ("idx_transactions_status", "transactions", "status"),
        ("idx_transactions_time", "transactions", "transaction_time"),
        ("idx_transactions_amount", "transactions", "amount"),
    ]
    for idx_name, table, column in indexes:
        cursor.execute(f"CREATE INDEX {idx_name} ON {table} ({column});")
    cursor.execute("CREATE INDEX idx_transactions_customer_time ON transactions (customer_id, transaction_time);")
    cursor.execute("ALTER TABLE transactions ADD CONSTRAINT fk_transactions_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id);")
    cursor.execute("ALTER TABLE transactions ADD CONSTRAINT fk_transactions_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(merchant_id);")
    conn.commit()
    print("   ✅ All indexes and constraints created")


def analyze_tables(conn):
    print("\n📈 Analyzing tables...")
    cursor = conn.cursor()
    for table in ["customers", "merchants", "transactions"]:
        cursor.execute(f"ANALYZE {table};")
    conn.commit()


def main():
    print("🚀 Seeding Docker PostgreSQL (Port 5433)...")
    base_date = datetime.now()
    conn = get_connection()
    try:
        create_tables(conn)
        bulk_insert_with_copy(conn, "customers", ["customer_id", "name", "email", "created_at"], generate_customers_batch, NUM_CUSTOMERS, base_date=base_date)
        bulk_insert_with_copy(conn, "merchants", ["merchant_id", "merchant_name", "category", "created_at"], generate_merchants_batch, NUM_MERCHANTS, base_date=base_date)
        bulk_insert_with_copy(conn, "transactions", ["transaction_id", "customer_id", "merchant_id", "amount", "status", "transaction_time"], generate_transactions_batch, NUM_TRANSACTIONS, num_customers=NUM_CUSTOMERS, num_merchants=NUM_MERCHANTS, base_date=base_date)
        create_indexes_and_constraints(conn)
        analyze_tables(conn)
        print("\n✅ SEEDING COMPLETE!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Docker PostgreSQL Transaction Data Generator (10M Rows)
=======================================================

Seeds 10M rows into Dockerized PostgreSQL (analytics-postgres-docker).
"""

import psycopg2
from io import StringIO
import random
import string
import time
from datetime import datetime, timedelta
from typing import List
import sys

# -------------------------------
# DATABASE CONFIGURATION (DOCKER)
# -------------------------------
DB_NAME = "datastuff"
DB_USER = "postgres"
DB_PASSWORD = "Password"
DB_HOST = "postgres-docker"  # Docker service name from docker-compose
DB_PORT = 5432                # Internal container port

# -------------------------------
# DATA GENERATION CONFIGURATION
# -------------------------------
NUM_CUSTOMERS = 1_000_000
NUM_MERCHANTS = 100_000
NUM_TRANSACTIONS = 10_000_000
BATCH_SIZE = 100_000

FIRST_NAMES = ["James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda"]
LAST_NAMES = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis"]
EMAIL_DOMAINS = ["gmail.com","yahoo.com","outlook.com","icloud.com"]
MERCHANT_PREFIXES = ["Super","Mega","Quick","Prime"]
MERCHANT_SUFFIXES = ["Mart","Store","Shop","Outlet"]
MERCHANT_CATEGORIES = ["Grocery","Electronics","Clothing","Restaurant"]
TRANSACTION_STATUSES = ["completed","pending","failed","refunded","cancelled"]
STATUS_WEIGHTS = [0.85, 0.05, 0.03, 0.05, 0.02]

# -------------------------------
# HELPER FUNCTIONS
# -------------------------------
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
        print(f"❌ Database connection error: {e}")
        sys.exit(1)


def create_tables(conn):
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
    print("✅ Tables created successfully.")


def random_email(first, last, customer_id):
    domain = random.choice(EMAIL_DOMAINS)
    sep = random.choice([".", "_", ""])
    num = random.randint(1, 9999) if random.random() > 0.5 else ""
    return f"{first.lower()}{sep}{last.lower()}{num}_{customer_id}@{domain}"


def generate_customers_batch(start_id, batch_size, base_date):
    buffer = StringIO()
    for i in range(batch_size):
        cid = start_id + i
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        name = f"{first} {last}"
        email = random_email(first, last, cid)
        created_at = base_date - timedelta(days=random.randint(0, 1825))
        buffer.write(f"{cid}\t{name}\t{email}\t{created_at}\n")
    buffer.seek(0)
    return buffer


def generate_merchants_batch(start_id, batch_size, base_date):
    buffer = StringIO()
    for i in range(batch_size):
        mid = start_id + i
        name = f"{random.choice(MERCHANT_PREFIXES)} {random.choice(MERCHANT_SUFFIXES)} {''.join(random.choices(string.ascii_uppercase, k=3))}"
        category = random.choice(MERCHANT_CATEGORIES)
        created_at = base_date - timedelta(days=random.randint(0, 1095))
        buffer.write(f"{mid}\t{name}\t{category}\t{created_at}\n")
    buffer.seek(0)
    return buffer


def generate_transactions_batch(start_id, batch_size, num_customers, num_merchants, base_date):
    buffer = StringIO()
    for i in range(batch_size):
        tid = start_id + i
        cid = random.randint(1, num_customers)
        mid = random.randint(1, num_merchants)
        amount_type = random.random()
        if amount_type < 0.6: amount = round(random.uniform(1,50),2)
        elif amount_type < 0.9: amount = round(random.uniform(50,500),2)
        else: amount = round(random.uniform(500,5000),2)
        status = random.choices(TRANSACTION_STATUSES, weights=STATUS_WEIGHTS)[0]
        transaction_time = base_date - timedelta(days=random.randint(0,730))
        buffer.write(f"{tid}\t{cid}\t{mid}\t{amount}\t{status}\t{transaction_time}\n")
    buffer.seek(0)
    return buffer


def bulk_insert(conn, table_name, columns, generator_func, total_rows, **kwargs):
    cursor = conn.cursor()
    cursor.execute(f"ALTER TABLE {table_name} DISABLE TRIGGER ALL;")
    rows_inserted = 0
    start_time = time.time()
    print(f"\n📥 Inserting {total_rows:,} rows into {table_name}...")

    while rows_inserted < total_rows:
        batch_size = min(BATCH_SIZE, total_rows - rows_inserted)
        start_id = rows_inserted + 1
        buffer = generator_func(start_id, batch_size, **kwargs)
        cursor.copy_from(buffer, table_name, columns=columns, null='')
        rows_inserted += batch_size
        if rows_inserted % 1_000_000 == 0 or rows_inserted == total_rows:
            elapsed = time.time() - start_time
            print(f"   ⏳ Progress: {rows_inserted:,}/{total_rows:,} ({rows_inserted/elapsed:,.0f} rows/sec)")

    cursor.execute(f"ALTER TABLE {table_name} ENABLE TRIGGER ALL;")
    conn.commit()


def main():
    print("🚀 Starting data generation (Docker PostgreSQL)...")
    base_date = datetime.now()
    conn = get_connection()
    try:
        create_tables(conn)
        bulk_insert(conn, "customers", ["customer_id","name","email","created_at"], generate_customers_batch, NUM_CUSTOMERS, base_date=base_date)
        bulk_insert(conn, "merchants", ["merchant_id","merchant_name","category","created_at"], generate_merchants_batch, NUM_MERCHANTS, base_date=base_date)
        bulk_insert(conn, "transactions", ["transaction_id","customer_id","merchant_id","amount","status","transaction_time"], generate_transactions_batch, NUM_TRANSACTIONS, num_customers=NUM_CUSTOMERS, num_merchants=NUM_MERCHANTS, base_date=base_date)
        print("\n✅ Data generation complete!")
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    main()


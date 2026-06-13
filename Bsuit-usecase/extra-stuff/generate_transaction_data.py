#!/usr/bin/env python3
"""
PostgreSQL Transaction Data Generator
=====================================

This script generates and inserts 10 million rows of transactional data into a local PostgreSQL database.
It creates realistic synthetic data for customers, merchants, and transactions tables.

SETUP INSTRUCTIONS:
-------------------
1. Install required package:
   pip install psycopg2-binary

2. Set your database credentials below:
   DB_NAME = "your_database_name"
   DB_USER = "your_username"
   DB_PASSWORD = "your_password"

3. Run the script:
   python generate_transaction_data.py

PERFORMANCE NOTES:
------------------
- Expected runtime: 3-8 minutes depending on hardware
- Uses PostgreSQL COPY command for maximum insert performance
- Indexes are created AFTER data insertion for speed
- Memory-efficient: generates data in batches
- Recommended: SSD storage, 8GB+ RAM

DATA VOLUMES:
-------------
- Customers: 1,000,000 rows
- Merchants: 100,000 rows
- Transactions: 10,000,000 rows

Author: Auto-generated
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
# DATABASE CONFIGURATION - EDIT THESE VALUES
# =============================================================================
DB_NAME = "datastuff"      # Change this
DB_USER = "postgres"           # Change this
DB_PASSWORD = "Password"       # Change this
DB_HOST = "localhost"               # Default: localhost
DB_PORT = 5432                      # Default: 5432

# =============================================================================
# DATA GENERATION CONFIGURATION
# =============================================================================
NUM_CUSTOMERS = 1_000_000      # 1 million customers
NUM_MERCHANTS = 100_000        # 100K merchants
NUM_TRANSACTIONS = 10_000_000  # 10 million transactions

BATCH_SIZE = 100_000           # Rows per batch for COPY operations

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
STATUS_WEIGHTS = [0.85, 0.05, 0.03, 0.05, 0.02]  # Weighted probabilities


def get_connection():
    """Establish database connection."""
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
        print("\nPlease check your database credentials:")
        print(f"   DB_NAME: {DB_NAME}")
        print(f"   DB_USER: {DB_USER}")
        print(f"   DB_HOST: {DB_HOST}")
        print(f"   DB_PORT: {DB_PORT}")
        sys.exit(1)


def create_tables(conn):
    """Create the required tables if they don't exist."""
    print("\n📋 Creating tables...")
    
    cursor = conn.cursor()
    
    # Drop existing tables (for clean runs)
    cursor.execute("""
        DROP TABLE IF EXISTS transactions CASCADE;
        DROP TABLE IF EXISTS customers CASCADE;
        DROP TABLE IF EXISTS merchants CASCADE;
    """)
    
    # Create customers table
    cursor.execute("""
        CREATE TABLE customers (
            customer_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL
        );
    """)
    
    # Create merchants table
    cursor.execute("""
        CREATE TABLE merchants (
            merchant_id SERIAL PRIMARY KEY,
            merchant_name VARCHAR(150) NOT NULL,
            category VARCHAR(50) NOT NULL,
            created_at TIMESTAMP NOT NULL
        );
    """)
    
    # Create transactions table (without indexes/FKs for faster insertion)
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
    """Generate a unique email address."""
    domain = random.choice(EMAIL_DOMAINS)
    separator = random.choice([".", "_", ""])
    number = random.randint(1, 9999) if random.random() > 0.5 else ""
    return f"{first_name.lower()}{separator}{last_name.lower()}{number}_{customer_id}@{domain}"


def generate_customers_batch(start_id: int, batch_size: int, base_date: datetime) -> StringIO:
    """Generate a batch of customer data as CSV for COPY."""
    buffer = StringIO()
    
    for i in range(batch_size):
        customer_id = start_id + i
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        name = f"{first_name} {last_name}"
        email = generate_random_email(first_name, last_name, customer_id)
        # Random date within last 5 years
        days_ago = random.randint(0, 1825)
        created_at = base_date - timedelta(days=days_ago, 
                                           hours=random.randint(0, 23),
                                           minutes=random.randint(0, 59))
        
        buffer.write(f"{customer_id}\t{name}\t{email}\t{created_at}\n")
    
    buffer.seek(0)
    return buffer


def generate_merchants_batch(start_id: int, batch_size: int, base_date: datetime) -> StringIO:
    """Generate a batch of merchant data as CSV for COPY."""
    buffer = StringIO()
    
    for i in range(batch_size):
        merchant_id = start_id + i
        prefix = random.choice(MERCHANT_PREFIXES)
        suffix = random.choice(MERCHANT_SUFFIXES)
        unique_id = ''.join(random.choices(string.ascii_uppercase, k=3))
        merchant_name = f"{prefix} {suffix} {unique_id}"
        category = random.choice(MERCHANT_CATEGORIES)
        # Random date within last 3 years
        days_ago = random.randint(0, 1095)
        created_at = base_date - timedelta(days=days_ago,
                                           hours=random.randint(0, 23),
                                           minutes=random.randint(0, 59))
        
        buffer.write(f"{merchant_id}\t{merchant_name}\t{category}\t{created_at}\n")
    
    buffer.seek(0)
    return buffer


def generate_transactions_batch(start_id: int, batch_size: int, 
                                 num_customers: int, num_merchants: int,
                                 base_date: datetime) -> StringIO:
    """Generate a batch of transaction data as CSV for COPY."""
    buffer = StringIO()
    
    for i in range(batch_size):
        transaction_id = start_id + i
        customer_id = random.randint(1, num_customers)
        merchant_id = random.randint(1, num_merchants)
        
        # Generate realistic transaction amounts
        # Mix of small (<$50), medium ($50-500), and large (>$500) transactions
        amount_type = random.random()
        if amount_type < 0.6:  # 60% small transactions
            amount = round(random.uniform(1.00, 50.00), 2)
        elif amount_type < 0.9:  # 30% medium transactions
            amount = round(random.uniform(50.00, 500.00), 2)
        else:  # 10% large transactions
            amount = round(random.uniform(500.00, 5000.00), 2)
        
        status = random.choices(TRANSACTION_STATUSES, weights=STATUS_WEIGHTS)[0]
        
        # Random time within last 2 years
        days_ago = random.randint(0, 730)
        transaction_time = base_date - timedelta(days=days_ago,
                                                  hours=random.randint(0, 23),
                                                  minutes=random.randint(0, 59),
                                                  seconds=random.randint(0, 59))
        
        buffer.write(f"{transaction_id}\t{customer_id}\t{merchant_id}\t{amount}\t{status}\t{transaction_time}\n")
    
    buffer.seek(0)
    return buffer


def bulk_insert_with_copy(conn, table_name: str, columns: List[str], 
                          generator_func, total_rows: int, **kwargs):
    """Perform bulk insert using PostgreSQL COPY command."""
    cursor = conn.cursor()
    
    # Temporarily disable triggers for faster insertion
    cursor.execute(f"ALTER TABLE {table_name} DISABLE TRIGGER ALL;")
    
    rows_inserted = 0
    start_time = time.time()
    
    print(f"\n📥 Inserting {total_rows:,} rows into {table_name}...")
    
    while rows_inserted < total_rows:
        batch_size = min(BATCH_SIZE, total_rows - rows_inserted)
        start_id = rows_inserted + 1
        
        # Generate batch data
        buffer = generator_func(start_id, batch_size, **kwargs)
        
        # Use COPY for fast insertion
        cursor.copy_from(buffer, table_name, columns=columns, null='')
        
        rows_inserted += batch_size
        
        # Progress logging
        elapsed = time.time() - start_time
        rate = rows_inserted / elapsed if elapsed > 0 else 0
        percent = (rows_inserted / total_rows) * 100
        
        # Print progress every 10% or for each batch
        if rows_inserted % (total_rows // 10) < BATCH_SIZE or rows_inserted == total_rows:
            print(f"   ⏳ Progress: {rows_inserted:,}/{total_rows:,} ({percent:.1f}%) - {rate:,.0f} rows/sec")
    
    # Re-enable triggers
    cursor.execute(f"ALTER TABLE {table_name} ENABLE TRIGGER ALL;")
    
    conn.commit()
    
    elapsed = time.time() - start_time
    print(f"   ✅ Completed in {elapsed:.2f}s ({total_rows/elapsed:,.0f} rows/sec)")


def create_indexes_and_constraints(conn):
    """Create indexes and foreign key constraints after data insertion."""
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
        print(f"   📌 Creating index {idx_name}...")
        start = time.time()
        cursor.execute(f"CREATE INDEX {idx_name} ON {table} ({column});")
        conn.commit()
        print(f"      Done in {time.time() - start:.2f}s")
    
    # Add composite index for common analytics queries
    print("   📌 Creating composite index idx_transactions_customer_time...")
    start = time.time()
    cursor.execute("CREATE INDEX idx_transactions_customer_time ON transactions (customer_id, transaction_time);")
    conn.commit()
    print(f"      Done in {time.time() - start:.2f}s")
    
    # Add foreign key constraints
    print("   🔗 Adding foreign key constraints...")
    start = time.time()
    cursor.execute("""
        ALTER TABLE transactions 
        ADD CONSTRAINT fk_transactions_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id);
    """)
    cursor.execute("""
        ALTER TABLE transactions 
        ADD CONSTRAINT fk_transactions_merchant 
        FOREIGN KEY (merchant_id) REFERENCES merchants(merchant_id);
    """)
    conn.commit()
    print(f"      Done in {time.time() - start:.2f}s")
    
    print("   ✅ All indexes and constraints created")


def verify_data(conn):
    """Verify data integrity and print summary statistics."""
    print("\n📊 Verifying data...")
    
    cursor = conn.cursor()
    
    # Count rows
    tables = ["customers", "merchants", "transactions"]
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table};")
        count = cursor.fetchone()[0]
        print(f"   {table}: {count:,} rows")
    
    # Sample transaction statistics
    cursor.execute("""
        SELECT 
            MIN(amount) as min_amount,
            MAX(amount) as max_amount,
            AVG(amount) as avg_amount,
            COUNT(DISTINCT customer_id) as unique_customers,
            COUNT(DISTINCT merchant_id) as unique_merchants
        FROM transactions;
    """)
    stats = cursor.fetchone()
    print(f"\n   Transaction Statistics:")
    print(f"   - Amount range: ${stats[0]:.2f} - ${stats[1]:.2f}")
    print(f"   - Average amount: ${stats[2]:.2f}")
    print(f"   - Unique customers: {stats[3]:,}")
    print(f"   - Unique merchants: {stats[4]:,}")
    
    # Status distribution
    cursor.execute("""
        SELECT status, COUNT(*) as count
        FROM transactions
        GROUP BY status
        ORDER BY count DESC;
    """)
    print(f"\n   Status Distribution:")
    for row in cursor.fetchall():
        print(f"   - {row[0]}: {row[1]:,}")


def analyze_tables(conn):
    """Run ANALYZE on tables to update statistics for query optimizer."""
    print("\n📈 Analyzing tables for query optimization...")
    cursor = conn.cursor()
    
    for table in ["customers", "merchants", "transactions"]:
        start = time.time()
        cursor.execute(f"ANALYZE {table};")
        print(f"   Analyzed {table} in {time.time() - start:.2f}s")
    
    conn.commit()


def main():
    """Main execution function."""
    print("=" * 60)
    print("🚀 PostgreSQL Transaction Data Generator")
    print("=" * 60)
    print(f"\nConfiguration:")
    print(f"   Customers:    {NUM_CUSTOMERS:,}")
    print(f"   Merchants:    {NUM_MERCHANTS:,}")
    print(f"   Transactions: {NUM_TRANSACTIONS:,}")
    print(f"   Batch size:   {BATCH_SIZE:,}")
    
    # Check if credentials are set
    if DB_NAME == "your_database_name" or DB_USER == "your_username":
        print("\n❌ ERROR: Please set your database credentials!")
        print("   Edit the DB_NAME, DB_USER, and DB_PASSWORD variables at the top of this script.")
        sys.exit(1)
    
    overall_start = time.time()
    base_date = datetime.now()
    
    # Connect to database
    print("\n🔌 Connecting to database...")
    conn = get_connection()
    print(f"   ✅ Connected to {DB_NAME}@{DB_HOST}:{DB_PORT}")
    
    try:
        # Create tables
        create_tables(conn)
        
        # Insert customers
        bulk_insert_with_copy(
            conn, 
            "customers", 
            ["customer_id", "name", "email", "created_at"],
            generate_customers_batch,
            NUM_CUSTOMERS,
            base_date=base_date
        )
        
        # Insert merchants
        bulk_insert_with_copy(
            conn, 
            "merchants", 
            ["merchant_id", "merchant_name", "category", "created_at"],
            generate_merchants_batch,
            NUM_MERCHANTS,
            base_date=base_date
        )
        
        # Insert transactions
        bulk_insert_with_copy(
            conn, 
            "transactions", 
            ["transaction_id", "customer_id", "merchant_id", "amount", "status", "transaction_time"],
            generate_transactions_batch,
            NUM_TRANSACTIONS,
            num_customers=NUM_CUSTOMERS,
            num_merchants=NUM_MERCHANTS,
            base_date=base_date
        )
        
        # Create indexes and constraints
        create_indexes_and_constraints(conn)
        
        # Analyze tables
        analyze_tables(conn)
        
        # Verify data
        verify_data(conn)
        
        # Final summary
        total_time = time.time() - overall_start
        total_rows = NUM_CUSTOMERS + NUM_MERCHANTS + NUM_TRANSACTIONS
        
        print("\n" + "=" * 60)
        print("✅ DATA GENERATION COMPLETE!")
        print("=" * 60)
        print(f"\n   Total rows inserted: {total_rows:,}")
        print(f"   Total time: {total_time:.2f} seconds ({total_time/60:.2f} minutes)")
        print(f"   Average throughput: {total_rows/total_time:,.0f} rows/second")
        print("\n   The database is ready for analytics queries! 🎉")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()
        print("\n🔌 Database connection closed.")


if __name__ == "__main__":
    main()

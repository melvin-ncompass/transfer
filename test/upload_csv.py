import pandas as pd
import psycopg2
from psycopg2 import sql
import numpy as np

def connect_to_datastuff_db():
    """Connect to the datastuff PostgreSQL database"""
    conn_params = {
        'host': 'localhost',
        'port': '5432',
        'user': 'postgres',
        'password': 'Password',
        'database': 'datastuff'
    }
    
    try:
        connection = psycopg2.connect(**conn_params)
        return connection
    except psycopg2.Error as e:
        print(f"Error connecting to PostgreSQL: {e}")
        return None

def create_sales_table(connection):
    """Create the sales table if it doesn't exist"""
    try:
        cursor = connection.cursor()
        
        create_table_query = """
        CREATE TABLE IF NOT EXISTS sales (
            sale_id VARCHAR(50) PRIMARY KEY,
            customer_id VARCHAR(50) NOT NULL,
            product_id VARCHAR(50) NOT NULL,
            store_id VARCHAR(50) NOT NULL,
            sale_date DATE NOT NULL,
            quantity INTEGER NOT NULL,
            total_amount DECIMAL(10, 2) NOT NULL
        );
        """
        
        cursor.execute(create_table_query)
        connection.commit()
        cursor.close()
        print("✓ Sales table created successfully (or already exists)")
        
    except psycopg2.Error as e:
        print(f"Error creating table: {e}")
        connection.rollback()

def upload_csv_to_db(csv_file_path, connection):
    """Upload CSV data to the sales table"""
    try:
        # Read CSV file
        print("Reading CSV file...")
        df = pd.read_csv(csv_file_path)
        print(f"✓ Loaded {len(df)} rows from CSV")
        
        # Display first few rows
        print("\nFirst 5 rows of data:")
        print(df.head())
        
        # Clean data
        print("\nCleaning data...")
        
        # Convert sale_date to proper date format
        df['sale_date'] = pd.to_datetime(df['sale_date']).dt.date
        
        # Round total_amount to 2 decimal places
        df['total_amount'] = df['total_amount'].round(2)
        
        # Check for any null values
        null_counts = df.isnull().sum()
        if null_counts.sum() > 0:
            print("Warning: Found null values:")
            print(null_counts[null_counts > 0])
        
        cursor = connection.cursor()
        
        # Clear existing data (optional - comment out if you want to append)
        print("Clearing existing data from sales table...")
        cursor.execute("DELETE FROM sales;")
        
        # Insert data
        print("Inserting data into database...")
        
        # Prepare insert query
        insert_query = """
        INSERT INTO sales (sale_id, customer_id, product_id, store_id, sale_date, quantity, total_amount)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        # Convert DataFrame to list of tuples
        data_tuples = [tuple(row) for row in df.values]
        
        # Execute batch insert
        cursor.executemany(insert_query, data_tuples)
        
        # Commit the transaction
        connection.commit()
        cursor.close()
        
        print(f"✓ Successfully uploaded {len(df)} records to the sales table!")
        
    except Exception as e:
        print(f"Error uploading CSV: {e}")
        connection.rollback()

def verify_upload(connection):
    """Verify the data was uploaded correctly"""
    try:
        cursor = connection.cursor()
        
        # Count total records
        cursor.execute("SELECT COUNT(*) FROM sales;")
        count = cursor.fetchone()[0]
        print(f"\nVerification: Total records in sales table: {count}")
        
        # Show first 5 records
        cursor.execute("SELECT * FROM sales LIMIT 5;")
        records = cursor.fetchall()
        
        print("\nFirst 5 records in database:")
        print("sale_id | customer_id | product_id | store_id | sale_date | quantity | total_amount")
        print("-" * 80)
        for record in records:
            print(f"{record[0]} | {record[1]} | {record[2]} | {record[3]} | {record[4]} | {record[5]} | {record[6]}")
        
        # Show some statistics
        cursor.execute("""
            SELECT 
                MIN(sale_date) as earliest_sale,
                MAX(sale_date) as latest_sale,
                MIN(total_amount) as min_amount,
                MAX(total_amount) as max_amount,
                AVG(total_amount) as avg_amount,
                SUM(total_amount) as total_sales
            FROM sales;
        """)
        
        stats = cursor.fetchone()
        print(f"\nSales Statistics:")
        print(f"Date range: {stats[0]} to {stats[1]}")
        print(f"Amount range: ${stats[2]:.2f} to ${stats[3]:.2f}")
        print(f"Average sale: ${stats[4]:.2f}")
        print(f"Total sales: ${stats[5]:.2f}")
        
        cursor.close()
        
    except psycopg2.Error as e:
        print(f"Error verifying upload: {e}")

def main():
    csv_file = r"c:\Users\Melvin M Shajan\Desktop\test\sales.csv"
    
    print("Connecting to datastuff database...")
    connection = connect_to_datastuff_db()
    
    if not connection:
        print("Failed to connect to database.")
        return
    
    print("✓ Connected to datastuff database!")
    
    try:
        # Create table
        create_sales_table(connection)
        
        # Upload CSV data
        upload_csv_to_db(csv_file, connection)
        
        # Verify upload
        verify_upload(connection)
        
    except Exception as e:
        print(f"An error occurred: {e}")
    
    finally:
        if connection:
            connection.close()
            print("\n✓ Database connection closed.")

if __name__ == "__main__":
    main()
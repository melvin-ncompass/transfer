import psycopg2
from psycopg2 import sql
import sys

def get_connection_params():
    """Get connection parameters from user input or use defaults"""
    print("PostgreSQL Connection Configuration")
    print("-" * 40)
    
    # Try common default configurations
    default_configs = [
        {'host': 'localhost', 'port': '5432', 'user': 'postgres'},
        {'host': '127.0.0.1', 'port': '5432', 'user': 'postgres'},
        {'host': 'localhost', 'port': '5433', 'user': 'postgres'},
    ]
    
    # You can also manually specify parameters here
    manual_config = {
        'host': 'localhost',     # Change this if needed
        'port': '5432',          # Change this if needed  
        'user': 'postgres',      # Change this to your username
        'password': 'Password',  # This matches what you specified
        'database': 'postgres'   # Default database to connect to first
    }
    
    return manual_config

def connect_to_postgres():
    """Connect to PostgreSQL database"""
    conn_params = get_connection_params()
    
    print(f"Attempting to connect to PostgreSQL...")
    print(f"Host: {conn_params['host']}")
    print(f"Port: {conn_params['port']}")
    print(f"User: {conn_params['user']}")
    print(f"Database: {conn_params['database']}")
    
    try:
        connection = psycopg2.connect(**conn_params)
        return connection, conn_params
    except psycopg2.Error as e:
        print(f"Error connecting to PostgreSQL: {e}")
        print("\nTroubleshooting tips:")
        print("1. Make sure PostgreSQL service is running")
        print("2. Check if the username is correct (might not be 'postgres')")
        print("3. Verify the host and port")
        print("4. Ensure the password is correct")
        print("5. Check if the database exists")
        return None, None

def list_databases(connection):
    """List all databases"""
    try:
        cursor = connection.cursor()
        cursor.execute("""
            SELECT datname 
            FROM pg_database 
            WHERE datistemplate = false
            ORDER BY datname;
        """)
        
        databases = cursor.fetchall()
        print("\n" + "="*50)
        print("DATABASES:")
        print("="*50)
        for db in databases:
            print(f"  • {db[0]}")
        
        cursor.close()
        return [db[0] for db in databases]
    except psycopg2.Error as e:
        print(f"Error listing databases: {e}")
        return []

def list_tables_in_database(db_name, conn_params):
    """List all tables in a specific database"""
    try:
        # Create new connection for specific database
        conn_params['database'] = db_name
        db_connection = psycopg2.connect(**conn_params)
        cursor = db_connection.cursor()
        
        # Get all tables in public schema
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        
        print(f"\n" + "-"*50)
        print(f"TABLES in database '{db_name}':")
        print("-"*50)
        
        if tables:
            for table in tables:
                print(f"  • {table[0]}")
        else:
            print("  No tables found in public schema")
        
        cursor.close()
        db_connection.close()
        
    except psycopg2.Error as e:
        print(f"Error listing tables in database '{db_name}': {e}")

def main():
    print("Connecting to PostgreSQL database...")
    
    # Connect to PostgreSQL
    connection, conn_params = connect_to_postgres()
    if not connection:
        print("Failed to connect to database. Please check your connection parameters.")
        return
    
    print("✓ Successfully connected to PostgreSQL!")
    
    # Remove database from conn_params for individual database connections
    base_conn_params = conn_params.copy()
    del base_conn_params['database']
    
    try:
        # List all databases
        databases = list_databases(connection)
        
        # List tables in each database
        for db_name in databases:
            list_tables_in_database(db_name, base_conn_params.copy())
        
    except Exception as e:
        print(f"An error occurred: {e}")
    
    finally:
        if connection:
            connection.close()
            print(f"\n{'='*50}")
            print("Connection closed.")

if __name__ == "__main__":
    main()

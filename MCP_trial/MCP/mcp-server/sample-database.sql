-- Sample PostgreSQL Schema for MCP Multi-Agent Testing
-- Execute this file in your local PostgreSQL instance to test the SQL Generation Agent.

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0
);

-- Seed Data
INSERT INTO customers (name, email) VALUES 
('Acme Corp', 'contact@acme.com'),
('Globex', 'sales@globex.com'),
('Initech', 'info@initech.com');

INSERT INTO orders (customer_id, amount, status) VALUES 
(1, 1500.00, 'COMPLETED'),
(1, 450.50, 'PENDING'),
(2, 8900.00, 'COMPLETED'),
(3, 120.00, 'COMPLETED');

INSERT INTO products (name, price, stock) VALUES 
('Widget A', 25.00, 100),
('Widget B', 45.00, 50),
('Super Widget', 199.99, 10);

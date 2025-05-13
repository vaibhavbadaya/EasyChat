-- Snowflake Data Warehouse Schema

-- Create database
CREATE DATABASE IF NOT EXISTS data_warehouse;
USE DATABASE data_warehouse;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS staging;
CREATE SCHEMA IF NOT EXISTS dwh;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS events;

-- Staging schema for raw data landing
USE SCHEMA staging;

-- Customer data staging table
CREATE TABLE IF NOT EXISTS customer_data_staging (
    customer_id VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50),
    full_name VARCHAR(255),
    source VARCHAR(50),
    created_at TIMESTAMP_NTZ,
    updated_at TIMESTAMP_NTZ,
    etl_execution_id VARCHAR(100),
    etl_timestamp TIMESTAMP_NTZ
);

-- Sales transactions staging table
CREATE TABLE IF NOT EXISTS sales_transactions_staging (
    transaction_id VARCHAR(50),
    customer_id VARCHAR(50),
    transaction_date TIMESTAMP_NTZ,
    total_amount DECIMAL(18,2),
    payment_method VARCHAR(50),
    store_id VARCHAR(50),
    etl_execution_id VARCHAR(100),
    etl_timestamp TIMESTAMP_NTZ
);

-- Sales transaction items staging table
CREATE TABLE IF NOT EXISTS sales_transaction_items_staging (
    transaction_id VARCHAR(50),
    product_id VARCHAR(50),
    quantity INTEGER,
    unit_price DECIMAL(18,2),
    discount DECIMAL(18,2),
    line_total DECIMAL(18,2),
    etl_execution_id VARCHAR(100),
    etl_timestamp TIMESTAMP_NTZ
);

-- Product data staging table
CREATE TABLE IF NOT EXISTS products_staging (
    product_id VARCHAR(50),
    product_name VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    supplier_id VARCHAR(50),
    cost_price DECIMAL(18,2),
    retail_price DECIMAL(18,2),
    sku VARCHAR(50),
    etl_execution_id VARCHAR(100),
    etl_timestamp TIMESTAMP_NTZ
);

-- Data Warehouse schema for transformed data
USE SCHEMA dwh;

-- Customer dimension table
CREATE TABLE IF NOT EXISTS customer_data (
    customer_id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50),
    full_name VARCHAR(255),
    source VARCHAR(50),
    created_at TIMESTAMP_NTZ,
    updated_at TIMESTAMP_NTZ,
    etl_execution_id VARCHAR(100),
    etl_timestamp TIMESTAMP_NTZ
);

-- Product dimension table
CREATE TABLE IF NOT EXISTS products (
    product_id VARCHAR(50) PRIMARY KEY,
    product_name VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    supplier_id VARCHAR(50),
    cost_price DECIMAL(18,2),
    retail_price DECIMAL(18,2),
    sku VARCHAR(50),
    created_at TIMESTAMP_NTZ,
    updated_at TIMESTAMP_NTZ,
    etl_execution_id VARCHAR(100),
    etl_timestamp TIMESTAMP_NTZ
);

-- Store dimension table
CREATE TABLE IF NOT EXISTS stores (
    store_id VARCHAR(50) PRIMARY KEY,
    store_name VARCHAR(255),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50),
    phone VARCHAR(50),
    manager_id VARCHAR(50),
    open_date DATE,
    etl_execution_id VARCHAR(100),
    etl_timestamp TIMESTAMP_NTZ
);

-- Date dimension table
CREATE TABLE IF NOT EXISTS date_dim (
    date_key INTEGER PRIMARY KEY,
    date_actual DATE,
    year INTEGER,
    quarter INTEGER,
    month INTEGER,
    month_name VARCHAR(10),
    day INTEGER,
    day_of_week INTEGER,
    day_name VARCHAR(10),
    week_of_year INTEGER,
    is_weekend BOOLEAN,
    is_holiday BOOLEAN,
    holiday_name VARCHAR(100)
);

-- Sales fact table
CREATE TABLE IF NOT EXISTS sales_fact (
    sales_key INTEGER IDENTITY(1,1) PRIMARY KEY,
    transaction_id VARCHAR(50),
    customer_id VARCHAR(50),
    product_id VARCHAR(50),
    store_id VARCHAR(50),
    date_key INTEGER,
    transaction_date TIMESTAMP_NTZ,
    quantity INTEGER,
    unit_price DECIMAL(18,2),
    discount DECIMAL(18,2),
    line_total DECIMAL(18,2),
    payment_method VARCHAR(50),
    etl_execution_id VARCHAR(100),
    etl_timestamp TIMESTAMP_NTZ,
    FOREIGN KEY (customer_id) REFERENCES customer_data(customer_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (date_key) REFERENCES date_dim(date_key)
);

-- Analytics schema for derived data models
USE SCHEMA analytics;

-- Sales by category
CREATE TABLE IF NOT EXISTS sales_by_category (
    category VARCHAR(100),
    total_sales DECIMAL(18,2),
    transaction_count INTEGER,
    avg_quantity_per_transaction DECIMAL(10,2),
    etl_execution_id VARCHAR(100),
    etl_timestamp TIMESTAMP_NTZ
);

-- Sales by customer segment
CREATE TABLE IF NOT EXISTS sales_by_segment (
    segment VARCHAR(100),
    total_sales DECIMAL(18,2),
    transaction_count INTEGER,
    avg_transaction_value DECIMAL(18,2),
    etl_execution_id VARCHAR(100),
    etl_timestamp TIMESTAMP_NTZ
);

-- Sales by date
CREATE TABLE IF NOT EXISTS sales_by_date (
    transaction_date DATE,
    total_sales DECIMAL(18,2),
    transaction_count INTEGER,
    etl_execution_id VARCHAR(100),
    etl_timestamp TIMESTAMP_NTZ
);

-- Customer purchase frequency
CREATE TABLE IF NOT EXISTS customer_purchase_frequency (
    customer_id VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    transaction_count INTEGER,
    total_spent DECIMAL(18,2),
    avg_transaction_value DECIMAL(18,2),
    etl_execution_id VARCHAR(100),
    etl_timestamp TIMESTAMP_NTZ
);

-- Product performance
CREATE TABLE IF NOT EXISTS product_performance (
    product_id VARCHAR(50),
    product_name VARCHAR(255),
    category VARCHAR(100),
    quantity_sold INTEGER,
    total_revenue DECIMAL(18,2),
    total_profit DECIMAL(18,2),
    profit_margin DECIMAL(10,4),
    etl_execution_id VARCHAR(100),
    etl_timestamp TIMESTAMP_NTZ
);

-- Events schema for streaming data
USE SCHEMA events;

-- User activity events
CREATE TABLE IF NOT EXISTS user_activity_events (
    event_id VARCHAR(50),
    user_id VARCHAR(50),
    session_id VARCHAR(100),
    event_type VARCHAR(50),
    page VARCHAR(255),
    product_id VARCHAR(50),
    category_id VARCHAR(50),
    timestamp TIMESTAMP_NTZ,
    device VARCHAR(50),
    browser VARCHAR(50),
    ip_address VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    processed_at TIMESTAMP_NTZ
);

-- Active users by time window
CREATE TABLE IF NOT EXISTS active_users_by_window (
    window_start TIMESTAMP_NTZ,
    window_end TIMESTAMP_NTZ,
    event_type VARCHAR(50),
    active_users INTEGER
);

-- Page views by time window
CREATE TABLE IF NOT EXISTS page_views_by_window (
    window_start TIMESTAMP_NTZ,
    window_end TIMESTAMP_NTZ,
    page VARCHAR(255),
    view_count INTEGER
);

-- Create views for common analytics queries
USE SCHEMA analytics;

-- Customer 360 view
CREATE OR REPLACE VIEW customer_360_view AS
SELECT
    c.customer_id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.city,
    c.state,
    c.country,
    COUNT(DISTINCT s.transaction_id) AS total_transactions,
    SUM(s.line_total) AS total_spent,
    AVG(s.line_total) AS avg_transaction_value,
    MIN(s.transaction_date) AS first_purchase_date,
    MAX(s.transaction_date) AS last_purchase_date,
    DATEDIFF('day', MIN(s.transaction_date), MAX(s.transaction_date)) AS customer_lifetime_days,
    COUNT(DISTINCT p.category) AS categories_purchased
FROM
    dwh.customer_data c
LEFT JOIN
    dwh.sales_fact s ON c.customer_id = s.customer_id
LEFT JOIN
    dwh.products p ON s.product_id = p.product_id
GROUP BY
    c.customer_id, c.first_name, c.last_name, c.email, c.phone, c.city, c.state, c.country;

-- Sales trend view
CREATE OR REPLACE VIEW sales_trend_view AS
SELECT
    d.year,
    d.quarter,
    d.month,
    d.month_name,
    SUM(s.line_total) AS total_sales,
    COUNT(DISTINCT s.transaction_id) AS transaction_count,
    COUNT(DISTINCT s.customer_id) AS customer_count,
    SUM(s.line_total) / COUNT(DISTINCT s.transaction_id) AS avg_transaction_value
FROM
    dwh.sales_fact s
JOIN
    dwh.date_dim d ON s.date_key = d.

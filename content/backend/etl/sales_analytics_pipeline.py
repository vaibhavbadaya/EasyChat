"""
Sales Analytics Pipeline

This pipeline processes sales transaction data, calculates key metrics,
and loads the results into analytics tables.
"""

import os
import logging
from datetime import datetime, timedelta

import pandas as pd
import numpy as np
from sqlalchemy import create_engine
import requests
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, sum, avg, count, lit, datediff, current_date

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database connection strings
POSTGRES_CONN = os.environ.get('POSTGRES_CONN')
SNOWFLAKE_CONN = os.environ.get('SNOWFLAKE_CONN')


class SalesAnalyticsPipeline:
    """Pipeline for processing sales data and generating analytics."""

    def __init__(self):
        """Initialize the pipeline with connections and Spark session."""
        self.postgres_engine = create_engine(POSTGRES_CONN)
        self.snowflake_engine = create_engine(SNOWFLAKE_CONN)
        
        # Initialize Spark session
        self.spark = SparkSession.builder \
            .appName("SalesAnalyticsPipeline") \
            .config("spark.jars.packages", "net.snowflake:snowflake-jdbc:3.13.14,net.snowflake:spark-snowflake_2.12:2.9.3-spark_3.1") \
            .getOrCreate()
        
        self.execution_date = datetime.now()
        self.execution_id = f"sales_pipeline_{self.execution_date.strftime('%Y%m%d_%H%M%S')}"
        
        logger.info(f"Initializing SalesAnalyticsPipeline with execution_id: {self.execution_id}")

    def extract_sales_data(self):
        """Extract sales transaction data from PostgreSQL."""
        logger.info("Extracting sales transaction data from PostgreSQL")
        
        try:
            query = """
            SELECT 
                t.transaction_id,
                t.customer_id,
                t.transaction_date,
                t.total_amount,
                t.payment_method,
                t.store_id,
                i.product_id,
                i.quantity,
                i.unit_price,
                i.discount,
                i.line_total
            FROM sales_transactions t
            JOIN sales_transaction_items i ON t.transaction_id = i.transaction_id
            WHERE t.transaction_date >= %s
            """
            
            # Get data from the last 30 days
            thirty_days_ago = self.execution_date - timedelta(days=30)
            
            # Use Spark to read from PostgreSQL
            jdbc_url = f"jdbc:postgresql://{POSTGRES_CONN.split('@')[1].split('/')[0]}/{POSTGRES_CONN.split('/')[-1]}"
            
            sales_df = self.spark.read \
                .format("jdbc") \
                .option("url", jdbc_url) \
                .option("dbtable", f"({query}) as sales_data") \
                .option("user", POSTGRES_CONN.split("://")[1].split(":")[0]) \
                .option("password", POSTGRES_CONN.split(":")[2].split("@")[0]) \
                .option("driver", "org.postgresql.Driver") \
                .option("query_params", [thirty_days_ago.strftime('%Y-%m-%d')]) \
                .load()
            
            logger.info(f"Extracted {sales_df.count()} sales transaction records")
            return sales_df
            
        except Exception as e:
            logger.error(f"Error extracting sales data: {str(e)}")
            raise

    def extract_product_data(self):
        """Extract product data from Snowflake."""
        logger.info("Extracting product data from Snowflake")
        
        try:
            # Use Spark to read from Snowflake
            product_df = self.spark.read \
                .format("net.snowflake.spark.snowflake") \
                .options(**{
                    "sfURL": SNOWFLAKE_CONN.split('@')[1].split('/')[0],
                    "sfUser": SNOWFLAKE_CONN.split("://")[1].split(":")[0],
                    "sfPassword": SNOWFLAKE_CONN.split(":")[2].split("@")[0],
                    "sfDatabase": SNOWFLAKE_CONN.split("/")[-1].split("?")[0],
                    "sfSchema": "dwh",
                    "sfWarehouse": "compute_wh",
                    "dbtable": "products"
                }) \
                .load()
            
            logger.info(f"Extracted {product_df.count()} product records")
            return product_df
            
        except Exception as e:
            logger.error(f"Error extracting product data: {str(e)}")
            raise

    def extract_customer_data(self):
        """Extract customer data from Snowflake."""
        logger.info("Extracting customer data from Snowflake")
        
        try:
            # Use Spark to read from Snowflake
            customer_df = self.spark.read \
                .format("net.snowflake.spark.snowflake") \
                .options(**{
                    "sfURL": SNOWFLAKE_CONN.split('@')[1].split('/')[0],
                    "sfUser": SNOWFLAKE_CONN.split("://")[1].split(":")[0],
                    "sfPassword": SNOWFLAKE_CONN.split(":")[2].split("@")[0],
                    "sfDatabase": SNOWFLAKE_CONN.split("/")[-1].split("?")[0],
                    "sfSchema": "dwh",
                    "sfWarehouse": "compute_wh",
                    "dbtable": "customer_data"
                }) \
                .load()
            
            logger.info(f"Extracted {customer_df.count()} customer records")
            return customer_df
            
        except Exception as e:
            logger.error(f"Error extracting customer data: {str(e)}")
            raise

    def transform_and_analyze(self, sales_df, product_df, customer_df):
        """Transform and analyze the sales data."""
        logger.info("Transforming and analyzing sales data")
        
        try:
            # Join sales data with product and customer data
            enriched_sales = sales_df \
                .join(product_df, "product_id", "left") \
                .join(customer_df, "customer_id", "left")
            
            # Calculate sales by product category
            sales_by_category = enriched_sales \
                .groupBy("category") \
                .agg(
                    sum("line_total").alias("total_sales"),
                    count("transaction_id").alias("transaction_count"),
                    avg("quantity").alias("avg_quantity_per_transaction")
                ) \
                .orderBy(col("total_sales").desc())
            
            # Calculate sales by customer segment
            sales_by_segment = enriched_sales \
                .groupBy("segment") \
                .agg(
                    sum("line_total").alias("total_sales"),
                    count("transaction_id").alias("transaction_count"),
                    avg("line_total").alias("avg_transaction_value")
                ) \
                .orderBy(col("total_sales").desc())
            
            # Calculate sales by date
            sales_by_date = enriched_sales \
                .groupBy("transaction_date") \
                .agg(
                    sum("line_total").alias("total_sales"),
                    count("transaction_id").alias("transaction_count")
                ) \
                .orderBy("transaction_date")
            
            # Calculate customer purchase frequency
            customer_frequency = enriched_sales \
                .groupBy("customer_id", "first_name", "last_name", "email") \
                .agg(
                    count("transaction_id").alias("transaction_count"),
                    sum("line_total").alias("total_spent"),
                    avg("line_total").alias("avg_transaction_value")
                ) \
                .orderBy(col("total_spent").desc())
            
            # Add execution metadata
            sales_by_category = sales_by_category \
                .withColumn("etl_execution_id", lit(self.execution_id)) \
                .withColumn("etl_timestamp", lit(self.execution_date.isoformat()))
            
            sales_by_segment = sales_by_segment \
                .withColumn("etl_execution_id", lit(self.execution_id)) \
                .withColumn("etl_timestamp", lit(self.execution_date.isoformat()))
            
            sales_by_date = sales_by_date \
                .withColumn("etl_execution_id", lit(self.execution_id)) \
                .withColumn("etl_timestamp", lit(self.execution_date.isoformat()))
            
            customer_frequency = customer_frequency \
                .withColumn("etl_execution_id", lit(self.execution_id)) \
                .withColumn("etl_timestamp", lit(self.execution_date.isoformat()))
            
            logger.info("Completed sales data transformation and analysis")
            
            return {
                "sales_by_category": sales_by_category,
                "sales_by_segment": sales_by_segment,
                "sales_by_date": sales_by_date,
                "customer_frequency": customer_frequency
            }
            
        except Exception as e:
            logger.error(f"Error transforming and analyzing sales data: {str(e)}")
            raise

    def load_to_snowflake(self, analysis_results):
        """Load analysis results to Snowflake."""
        logger.info("Loading analysis results to Snowflake")
        
        try:
            # Write sales by category
            analysis_results["sales_by_category"].write \
                .format("net.snowflake.spark.snowflake") \
                .options(**{
                    "sfURL": SNOWFLAKE_CONN.split('@')[1].split('/')[0],
                    "sfUser": SNOWFLAKE_CONN.split("://")[1].split(":")[0],
                    "sfPassword": SNOWFLAKE_CONN.split(":")[2].split("@")[0],
                    "sfDatabase": SNOWFLAKE_CONN.split("/")[-1].split("?")[0],
                    "sfSchema": "analytics",
                    "sfWarehouse": "compute_wh",
                    "dbtable": "sales_by_category",
                    "truncate_table": "ON"
                }) \
                .mode("overwrite") \
                .save()
            
            # Write sales by segment
            analysis_results["sales_by_segment"].write \
                .format("net.snowflake.spark.snowflake") \
                .options(**{
                    "sfURL": SNOWFLAKE_CONN.split('@')[1].split('/')[0],
                    "sfUser": SNOWFLAKE_CONN.split("://")[1].split(":")[0],
                    "sfPassword": SNOWFLAKE_CONN.split(":")[2].split("@")[0],
                    "sfDatabase": SNOWFLAKE_CONN.split("/")[-1].split("?")[0],
                    "sfSchema": "analytics",
                    "sfWarehouse": "compute_wh",
                    "dbtable": "sales_by_segment",
                    "truncate_table": "ON"
                }) \
                .mode("overwrite") \
                .save()
            
            # Write sales by date
            analysis_results["sales_by_date"].write \
                .format("net.snowflake.spark.snowflake") \
                .options(**{
                    "sfURL": SNOWFLAKE_CONN.split('@')[1].split('/')[0],
                    "sfUser": SNOWFLAKE_CONN.split("://")[1].split(":")[0],
                    "sfPassword": SNOWFLAKE_CONN.split(":")[2].split("@")[0],
                    "sfDatabase": SNOWFLAKE_CONN.split("/")[-1].split("?")[0],
                    "sfSchema": "analytics",
                    "sfWarehouse": "compute_wh",
                    "dbtable": "sales_by_date",
                    "truncate_table": "ON"
                }) \
                .mode("overwrite") \
                .save()
            
            # Write customer frequency
            analysis_results["customer_frequency"].write \
                .format("net.snowflake.spark.snowflake") \
                .options(**{
                    "sfURL": SNOWFLAKE_CONN.split('@')[1].split('/')[0],
                    "sfUser": SNOWFLAKE_CONN.split("://")[1].split(":")[0],
                    "sfPassword": SNOWFLAKE_CONN.split(":")[2].split("@")[0],
                    "sfDatabase": SNOWFLAKE_CONN.split("/")[-1].split("?")[0],
                    "sfSchema": "analytics",
                    "sfWarehouse": "compute_wh",
                    "dbtable": "customer_purchase_frequency",
                    "truncate_table": "ON"
                }) \
                .mode("overwrite") \
                .save()
            
            logger.info("Successfully loaded analysis results to Snowflake")
            
        except Exception as e:
            logger.error(f"Error loading analysis results to Snowflake: {str(e)}")
            raise

    def run(self):
        """Execute the full ETL pipeline."""
        logger.info(f"Starting SalesAnalyticsPipeline execution: {self.execution_id}")
        
        try:
            # Extract
            sales_df = self.extract_sales_data()
            product_df = self.extract_product_data()
            customer_df = self.extract_customer_data()
            
            # Transform and analyze
            analysis_results = self.transform_and_analyze(sales_df, product_df, customer_df)
            
            # Load
            self.load_to_snowflake(analysis_results)
            
            # Clean up Spark session
            self.spark.stop()
            
            logger.info(f"SalesAnalyticsPipeline execution completed successfully: {self.execution_id}")
            return {
                'status': 'success',
                'execution_id': self.execution_id,
                'records_processed': sales_df.count(),
                'timestamp': self.execution_date.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Pipeline execution failed: {str(e)}")
            # Clean up Spark session
            self.spark.stop()
            
            return {
                'status': 'failed',
                'execution_id': self.execution_id,
                'error': str(e),
                'timestamp': self.execution_date.isoformat()
            }


if __name__ == "__main__":
    pipeline = SalesAnalyticsPipeline()
    result = pipeline.run()
    print(result)

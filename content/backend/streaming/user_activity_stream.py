"""
User Activity Stream Processor

This module processes real-time user activity events from Kafka,
performs transformations, and loads the results into various destinations.
"""

import os
import json
import logging
from datetime import datetime

import pandas as pd
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json, window, count, expr, lit
from pyspark.sql.types import StructType, StructField, StringType, TimestampType, IntegerType
from kafka import KafkaConsumer, KafkaProducer
import redis

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Kafka configuration
KAFKA_BOOTSTRAP_SERVERS = os.environ.get('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
KAFKA_INPUT_TOPIC = os.environ.get('KAFKA_INPUT_TOPIC', 'user-activity-events')
KAFKA_OUTPUT_TOPIC = os.environ.get('KAFKA_OUTPUT_TOPIC', 'processed-user-activity')

# Redis configuration
REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
REDIS_DB = int(os.environ.get('REDIS_DB', 0))

# Snowflake configuration
SNOWFLAKE_CONN = os.environ.get('SNOWFLAKE_CONN')


class UserActivityStreamProcessor:
    """Processor for real-time user activity events."""

    def __init__(self):
        """Initialize the stream processor."""
        # Initialize Spark session
        self.spark = SparkSession.builder \
            .appName("UserActivityStreamProcessor") \
            .config("spark.streaming.stopGracefullyOnShutdown", "true") \
            .config("spark.jars.packages", 
                   "org.apache.spark:spark-sql-kafka-0-10_2.12:3.1.2,"
                   "net.snowflake:snowflake-jdbc:3.13.14,"
                   "net.snowflake:spark-snowflake_2.12:2.9.3-spark_3.1") \
            .getOrCreate()
        
        # Initialize Redis client
        self.redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            db=REDIS_DB
        )
        
        # Initialize Kafka producer
        self.kafka_producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        
        logger.info("Initialized UserActivityStreamProcessor")

    def define_schema(self):
        """Define the schema for user activity events."""
        return StructType([
            StructField("event_id", StringType(), True),
            StructField("user_id", StringType(), True),
            StructField("session_id", StringType(), True),
            StructField("event_type", StringType(), True),
            StructField("page", StringType(), True),
            StructField("product_id", StringType(), True),
            StructField("category_id", StringType(), True),
            StructField("timestamp", TimestampType(), True),
            StructField("device", StringType(), True),
            StructField("browser", StringType(), True),
            StructField("ip_address", StringType(), True),
            StructField("country", StringType(), True),
            StructField("city", StringType(), True)
        ])

    def read_from_kafka(self):
        """Read user activity events from Kafka."""
        logger.info(f"Reading events from Kafka topic: {KAFKA_INPUT_TOPIC}")
        
        schema = self.define_schema()
        
        kafka_df = self.spark \
            .readStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP_SERVERS) \
            .option("subscribe", KAFKA_INPUT_TOPIC) \
            .option("startingOffsets", "latest") \
            .load()
        
        # Parse JSON data
        parsed_df = kafka_df \
            .selectExpr("CAST(value AS STRING)") \
            .select(from_json(col("value"), schema).alias("data")) \
            .select("data.*")
        
        return parsed_df

    def process_events(self, events_df):
        """Process user activity events."""
        logger.info("Processing user activity events")
        
        # 1. Filter out invalid events
        valid_events = events_df.filter(col("user_id").isNotNull() & col("event_type").isNotNull())
        
        # 2. Enrich events with additional information
        # (In a real implementation, this might involve joining with user or product data)
        
        # 3. Calculate real-time metrics
        
        # Active users in 5-minute windows
        active_users = valid_events \
            .withWatermark("timestamp", "10 minutes") \
            .groupBy(window(col("timestamp"), "5 minutes"), col("event_type")) \
            .agg(count("user_id").alias("active_users"))
        
        # Page views by page
        page_views = valid_events \
            .filter(col("event_type") == "page_view") \
            .withWatermark("timestamp", "10 minutes") \
            .groupBy(window(col("timestamp"), "5 minutes"), col("page")) \
            .count() \
            .withColumnRenamed("count", "view_count")
        
        # Product views
        product_views = valid_events \
            .filter(col("event_type") == "product_view") \
            .withWatermark("timestamp", "10 minutes") \
            .groupBy(window(col("timestamp"), "5 minutes"), col("product_id")) \
            .count() \
            .withColumnRenamed("count", "view_count")
        
        # Add-to-cart events
        add_to_cart = valid_events \
            .filter(col("event_type") == "add_to_cart") \
            .withWatermark("timestamp", "10 minutes") \
            .groupBy(window(col("timestamp"), "5 minutes"), col("product_id")) \
            .count() \
            .withColumnRenamed("count", "cart_count")
        
        return {
            "valid_events": valid_events,
            "active_users": active_users,
            "page_views": page_views,
            "product_views": product_views,
            "add_to_cart": add_to_cart
        }

    def update_redis_metrics(self, batch_df, batch_id):
        """Update real-time metrics in Redis."""
        # This function is called for each microbatch of data
        try:
            # Convert batch to pandas for easier processing
            pandas_df = batch_df.toPandas()
            
            # Group by event type and count
            event_counts = pandas_df.groupby("event_type").size().to_dict()
            
            # Update Redis counters
            for event_type, count in event_counts.items():
                # Increment counter for this event type
                self.redis_client.incrby(f"user_activity:count:{event_type}", count)
                
                # Set expiry for 24 hours
                self.redis_client.expire(f"user_activity:count:{event_type}", 86400)
            
            # Update active users set
            user_ids = pandas_df["user_id"].unique().tolist()
            if user_ids:
                # Add users to active users set
                self.redis_client.sadd("user_activity:active_users", *user_ids)
                # Set expiry for 1 hour
                self.redis_client.expire("user_activity:active_users", 3600)
            
            # Update popular pages
            page_counts = pandas_df[pandas_df["event_type"] == "page_view"].groupby("page").size().to_dict()
            for page, count in page_counts.items():
                # Increment sorted set score for this page
                self.redis_client.zincrby("user_activity:popular_pages", count, page)
            
            # Update popular products
            product_counts = pandas_df[pandas_df["event_type"] == "product_view"].groupby("product_id").size().to_dict()
            for product_id, count in product_counts.items():
                # Increment sorted set score for this product
                self.redis_client.zincrby("user_activity:popular_products", count, product_id)
            
            logger.info(f"Updated Redis metrics for batch {batch_id}")
            
        except Exception as e:
            logger.error(f"Error updating Redis metrics: {str(e)}")

    def forward_to_kafka(self, batch_df, batch_id):
        """Forward processed events to another Kafka topic."""
        try:
            # Convert batch to pandas for easier processing
            pandas_df = batch_df.toPandas()
            
            # Convert timestamp to string for JSON serialization
            pandas_df["timestamp"] = pandas_df["timestamp"].astype(str)
            
            # Send each record to Kafka
            for _, row in pandas_df.iterrows():
                event = row.to_dict()
                # Add processing metadata
                event["processed_at"] = datetime.now().isoformat()
                event["batch_id"] = str(batch_id)
                
                # Send to Kafka
                self.kafka_producer.send(KAFKA_OUTPUT_TOPIC, event)
            
            logger.info(f"Forwarded {len(pandas_df)} events to Kafka topic {KAFKA_OUTPUT_TOPIC}")
            
        except Exception as e:
            logger.error(f"Error forwarding to Kafka: {str(e)}")

    def write_to_snowflake(self, df, checkpoint_location, table_name):
        """Write streaming data to Snowflake."""
        return df.writeStream \
            .format("snowflake") \
            .options(**{
                "sfURL": SNOWFLAKE_CONN.split('@')[1].split('/')[0],
                "sfUser": SNOWFLAKE_CONN.split("://")[1].split(":")[0],
                "sfPassword": SNOWFLAKE_CONN.split(":")[2].split("@")[0],
                "sfDatabase": SNOWFLAKE_CONN.split("/")[-1].split("?")[0],
                "sfSchema": "events",
                "sfWarehouse": "compute_wh",
                "dbtable": table_name
            }) \
            .option("checkpointLocation", checkpoint_location) \
            .outputMode("append") \
            .start()

    def run(self):
        """Run the stream processing pipeline."""
        logger.info("Starting user activity stream processing")
        
        try:
            # Read events from Kafka
            events_df = self.read_from_kafka()
            
            # Process events
            processed_events = self.process_events(events_df)
            
            # Write raw events to Snowflake
            raw_events_query = self.write_to_snowflake(
                processed_events["valid_events"],
                "/tmp/checkpoints/user_activity/raw_events",
                "user_activity_events"
            )
            
            # Write active users to Snowflake
            active_users_query = self.write_to_snowflake(
                processed_events["active_users"],
                "/tmp/checkpoints/user_activity/active_users",
                "active_users_by_window"
            )
            
            # Write page views to Snowflake
            page_views_query = self.write_to_snowflake(
                processed_events["page_views"],
                "/tmp/checkpoints/user_activity/page_views",
                "page_views_by_window"
            )
            
            # Update Redis and forward to Kafka for each batch of raw events
            redis_kafka_query = processed_events["valid_events"] \
                .writeStream \
                .foreachBatch(lambda batch_df, batch_id: self.process_batch(batch_df, batch_id)) \
                .option("checkpointLocation", "/tmp/checkpoints/user_activity/redis_kafka") \
                .start()
            
            # Wait for termination
            self.spark.streams.awaitAnyTermination()
            
        except Exception as e:
            logger.error(f"Error in stream processing: {str(e)}")
            # Clean up Spark session
            self.spark.stop()
    
    def process_batch(self, batch_df, batch_id):
        """Process each microbatch of data."""
        # Update Redis metrics
        self.update_redis_metrics(batch_df, batch_id)
        
        # Forward to Kafka
        self.forward_to_kafka(batch_df, batch_id)


if __name__ == "__main__":
    processor = UserActivityStreamProcessor()
    processor.run()

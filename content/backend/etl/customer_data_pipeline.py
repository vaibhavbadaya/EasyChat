"""
Customer Data Integration Pipeline

This pipeline extracts customer data from multiple sources,
transforms it, and loads it into the data warehouse.
"""

import os
import logging
from datetime import datetime, timedelta

import pandas as pd
import numpy as np
from sqlalchemy import create_engine
import requests
import boto3
from botocore.exceptions import ClientError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database connection strings
POSTGRES_CONN = os.environ.get('POSTGRES_CONN')
SNOWFLAKE_CONN = os.environ.get('SNOWFLAKE_CONN')

# API credentials
SALESFORCE_API_KEY = os.environ.get('SALESFORCE_API_KEY')
SALESFORCE_API_SECRET = os.environ.get('SALESFORCE_API_SECRET')
SALESFORCE_URL = os.environ.get('SALESFORCE_URL')

# S3 configuration
S3_BUCKET = os.environ.get('S3_BUCKET')
S3_PREFIX = 'customer_data/'
AWS_ACCESS_KEY = os.environ.get('AWS_ACCESS_KEY')
AWS_SECRET_KEY = os.environ.get('AWS_SECRET_KEY')


class CustomerDataPipeline:
    """Pipeline for processing customer data from multiple sources."""

    def __init__(self):
        """Initialize the pipeline with connections to data sources and destinations."""
        self.postgres_engine = create_engine(POSTGRES_CONN)
        self.snowflake_engine = create_engine(SNOWFLAKE_CONN)
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY,
            aws_secret_access_key=AWS_SECRET_KEY
        )
        self.execution_date = datetime.now()
        self.execution_id = f"customer_pipeline_{self.execution_date.strftime('%Y%m%d_%H%M%S')}"
        
        logger.info(f"Initializing CustomerDataPipeline with execution_id: {self.execution_id}")

    def extract_from_postgres(self):
        """Extract customer data from PostgreSQL database."""
        logger.info("Extracting customer data from PostgreSQL")
        
        try:
            query = """
            SELECT 
                customer_id,
                first_name,
                last_name,
                email,
                phone,
                address,
                city,
                state,
                postal_code,
                country,
                created_at,
                updated_at
            FROM customers
            WHERE updated_at >= %s
            """
            
            # Get data updated in the last day
            yesterday = self.execution_date - timedelta(days=1)
            
            df = pd.read_sql(
                query, 
                self.postgres_engine, 
                params=[yesterday.strftime('%Y-%m-%d')]
            )
            
            logger.info(f"Extracted {len(df)} customer records from PostgreSQL")
            return df
            
        except Exception as e:
            logger.error(f"Error extracting data from PostgreSQL: {str(e)}")
            raise

    def extract_from_salesforce(self):
        """Extract customer data from Salesforce API."""
        logger.info("Extracting customer data from Salesforce API")
        
        try:
            # Get OAuth token
            auth_url = f"{SALESFORCE_URL}/services/oauth2/token"
            auth_data = {
                'grant_type': 'client_credentials',
                'client_id': SALESFORCE_API_KEY,
                'client_secret': SALESFORCE_API_SECRET
            }
            
            auth_response = requests.post(auth_url, data=auth_data)
            auth_response.raise_for_status()
            
            access_token = auth_response.json()['access_token']
            
            # Query Salesforce for customer data
            headers = {
                'Authorization': f"Bearer {access_token}",
                'Content-Type': 'application/json'
            }
            
            # Get data updated in the last day
            yesterday = self.execution_date - timedelta(days=1)
            date_filter = yesterday.strftime('%Y-%m-%dT%H:%M:%SZ')
            
            query = f"""
            SELECT 
                Id,
                FirstName,
                LastName,
                Email,
                Phone,
                MailingStreet,
                MailingCity,
                MailingState,
                MailingPostalCode,
                MailingCountry,
                CreatedDate,
                LastModifiedDate
            FROM Contact
            WHERE LastModifiedDate >= {date_filter}
            """
            
            encoded_query = query.replace(' ', '+')
            url = f"{SALESFORCE_URL}/services/data/v53.0/query?q={encoded_query}"
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            # Convert to DataFrame
            records = response.json()['records']
            df = pd.DataFrame(records)
            
            logger.info(f"Extracted {len(df)} customer records from Salesforce")
            return df
            
        except Exception as e:
            logger.error(f"Error extracting data from Salesforce: {str(e)}")
            raise

    def extract_from_s3(self):
        """Extract customer data from S3 bucket."""
        logger.info(f"Extracting customer data from S3 bucket: {S3_BUCKET}/{S3_PREFIX}")
        
        try:
            # List objects in the bucket with the given prefix
            response = self.s3_client.list_objects_v2(
                Bucket=S3_BUCKET,
                Prefix=S3_PREFIX
            )
            
            if 'Contents' not in response:
                logger.info("No files found in S3")
                return pd.DataFrame()
            
            # Get the most recent file
            files = sorted(
                response['Contents'],
                key=lambda x: x['LastModified'],
                reverse=True
            )
            
            latest_file = files[0]['Key']
            logger.info(f"Processing latest file: {latest_file}")
            
            # Download the file
            response = self.s3_client.get_object(
                Bucket=S3_BUCKET,
                Key=latest_file
            )
            
            # Read CSV data
            df = pd.read_csv(response['Body'])
            
            logger.info(f"Extracted {len(df)} customer records from S3")
            return df
            
        except ClientError as e:
            logger.error(f"AWS error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error extracting data from S3: {str(e)}")
            raise

    def transform_data(self, postgres_df, salesforce_df, s3_df):
        """Transform and clean the customer data."""
        logger.info("Transforming customer data")
        
        try:
            # Rename columns to standardized format
            if not postgres_df.empty:
                postgres_df = postgres_df.rename(columns={
                    'customer_id': 'customer_id',
                    'first_name': 'first_name',
                    'last_name': 'last_name',
                    'email': 'email',
                    'phone': 'phone',
                    'address': 'street',
                    'city': 'city',
                    'state': 'state',
                    'postal_code': 'postal_code',
                    'country': 'country',
                    'created_at': 'created_at',
                    'updated_at': 'updated_at'
                })
                postgres_df['source'] = 'postgres'
            
            if not salesforce_df.empty:
                salesforce_df = salesforce_df.rename(columns={
                    'Id': 'customer_id',
                    'FirstName': 'first_name',
                    'LastName': 'last_name',
                    'Email': 'email',
                    'Phone': 'phone',
                    'MailingStreet': 'street',
                    'MailingCity': 'city',
                    'MailingState': 'state',
                    'MailingPostalCode': 'postal_code',
                    'MailingCountry': 'country',
                    'CreatedDate': 'created_at',
                    'LastModifiedDate': 'updated_at'
                })
                salesforce_df['source'] = 'salesforce'
            
            if not s3_df.empty:
                # Assuming S3 file has columns that match our target schema
                s3_df['source'] = 's3'
            
            # Combine all data sources
            dfs_to_combine = []
            if not postgres_df.empty:
                dfs_to_combine.append(postgres_df)
            if not salesforce_df.empty:
                dfs_to_combine.append(salesforce_df)
            if not s3_df.empty:
                dfs_to_combine.append(s3_df)
            
            if not dfs_to_combine:
                logger.info("No data to transform")
                return pd.DataFrame()
            
            combined_df = pd.concat(dfs_to_combine, ignore_index=True)
            
            # Clean data
            # 1. Remove duplicates based on customer_id
            combined_df = combined_df.drop_duplicates(subset=['customer_id'], keep='last')
            
            # 2. Convert email to lowercase
            combined_df['email'] = combined_df['email'].str.lower()
            
            # 3. Standardize phone numbers (remove non-numeric characters)
            combined_df['phone'] = combined_df['phone'].str.replace(r'\D', '', regex=True)
            
            # 4. Fill missing values
            combined_df['first_name'] = combined_df['first_name'].fillna('')
            combined_df['last_name'] = combined_df['last_name'].fillna('')
            
            # 5. Add a full_name column
            combined_df['full_name'] = combined_df['first_name'] + ' ' + combined_df['last_name']
            combined_df['full_name'] = combined_df['full_name'].str.strip()
            
            # 6. Add pipeline execution metadata
            combined_df['etl_execution_id'] = self.execution_id
            combined_df['etl_timestamp'] = self.execution_date
            
            logger.info(f"Transformed {len(combined_df)} customer records")
            return combined_df
            
        except Exception as e:
            logger.error(f"Error transforming data: {str(e)}")
            raise

    def load_to_snowflake(self, df):
        """Load transformed data to Snowflake data warehouse."""
        if df.empty:
            logger.info("No data to load to Snowflake")
            return
        
        logger.info(f"Loading {len(df)} records to Snowflake")
        
        try:
            # Load to staging table
            df.to_sql(
                'customer_data_staging',
                self.snowflake_engine,
                if_exists='replace',
                index=False,
                schema='staging'
            )
            
            # Execute Snowflake merge operation
            with self.snowflake_engine.connect() as conn:
                conn.execute("""
                MERGE INTO dwh.customer_data target
                USING staging.customer_data_staging source
                ON target.customer_id = source.customer_id
                WHEN MATCHED THEN
                    UPDATE SET
                        first_name = source.first_name,
                        last_name = source.last_name,
                        email = source.email,
                        phone = source.phone,
                        street = source.street,
                        city = source.city,
                        state = source.state,
                        postal_code = source.postal_code,
                        country = source.country,
                        full_name = source.full_name,
                        source = source.source,
                        updated_at = source.updated_at,
                        etl_execution_id = source.etl_execution_id,
                        etl_timestamp = source.etl_timestamp
                WHEN NOT MATCHED THEN
                    INSERT (
                        customer_id, first_name, last_name, email, phone,
                        street, city, state, postal_code, country,
                        full_name, source, created_at, updated_at,
                        etl_execution_id, etl_timestamp
                    )
                    VALUES (
                        source.customer_id, source.first_name, source.last_name,
                        source.email, source.phone, source.street, source.city,
                        source.state, source.postal_code, source.country,
                        source.full_name, source.source, source.created_at,
                        source.updated_at, source.etl_execution_id, source.etl_timestamp
                    )
                """)
            
            logger.info("Successfully loaded data to Snowflake")
            
        except Exception as e:
            logger.error(f"Error loading data to Snowflake: {str(e)}")
            raise

    def run(self):
        """Execute the full ETL pipeline."""
        logger.info(f"Starting CustomerDataPipeline execution: {self.execution_id}")
        
        try:
            # Extract
            postgres_df = self.extract_from_postgres()
            salesforce_df = self.extract_from_salesforce()
            s3_df = self.extract_from_s3()
            
            # Transform
            transformed_df = self.transform_data(postgres_df, salesforce_df, s3_df)
            
            # Load
            self.load_to_snowflake(transformed_df)
            
            logger.info(f"CustomerDataPipeline execution completed successfully: {self.execution_id}")
            return {
                'status': 'success',
                'execution_id': self.execution_id,
                'records_processed': len(transformed_df),
                'timestamp': self.execution_date.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Pipeline execution failed: {str(e)}")
            return {
                'status': 'failed',
                'execution_id': self.execution_id,
                'error': str(e),
                'timestamp': self.execution_date.isoformat()
            }


if __name__ == "__main__":
    pipeline = CustomerDataPipeline()
    result = pipeline.run()
    print(result)

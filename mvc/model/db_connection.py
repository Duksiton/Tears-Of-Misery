import MySQLdb
from flask import current_app
import logging

def create_connection():
    try:
        connection = MySQLdb.connect(
            host=current_app.config['MYSQL_HOST'],
            user=current_app.config['MYSQL_USER'],
            password=current_app.config['MYSQL_PASSWORD'],
            database=current_app.config['MYSQL_DB'],
            port=current_app.config['MYSQL_PORT']
        )
        logging.info("Database connection successful")
        return connection
    except MySQLdb.Error as e:
        logging.error(f"Error connecting to MySQL Platform: {e}")
        return None
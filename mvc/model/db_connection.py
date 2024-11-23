import mysql.connector
from mysql.connector import Error
from flask import current_app
import MySQLdb as mysql
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

def close_connection(connection):
    if connection and connection.is_connected():
        connection.close()

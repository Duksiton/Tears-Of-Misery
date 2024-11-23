import MySQLdb as mysql
from flask import current_app
import logging

def create_connection():
    try:
        connection = mysql.connect(
            host=current_app.config['MYSQL_HOST'],
            user=current_app.config['MYSQL_USER'],
            password=current_app.config['MYSQL_PASSWORD'],
            database=current_app.config['MYSQL_DB'],
            port=current_app.config['MYSQL_PORT']
        )
        logging.info("Conexión a la base de datos exitosa")
        return connection
    except mysql.Error as e:
        logging.error(f"Error al conectar con la base de datos MySQL: {e}")
        return None

def close_connection(connection):
    try:
        if connection:
            connection.close()
            logging.info("Conexión cerrada exitosamente")
    except Exception as e:
        logging.error(f"Error al cerrar la conexión: {e}")

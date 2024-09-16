from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from mvc.model.db_connection import create_connection, close_connection
from mysql.connector import Error

# Crear el Blueprint para el controlador de logout
logout_controller = Blueprint('logout', __name__)

@logout_controller.route('/logout')
def logout():
    session.pop('user', None)  # Eliminar el usuario de la sesión
    flash("Sesión cerrada exitosamente.")
    return redirect(url_for('login'))  # Asegúrate de que la ruta 'login' esté definida

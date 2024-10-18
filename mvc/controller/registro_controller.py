from flask import Blueprint, render_template, request, redirect, url_for, flash
from mvc.model.db_connection import create_connection, close_connection
from mysql.connector import Error
import bcrypt  # Importar bcrypt

registro_controller = Blueprint('registro_controller', __name__)

@registro_controller.route('/registro', methods=['GET', 'POST'])
def registro():
    if request.method == 'POST':
        nombre = request.form['nombre']
        email = request.form['email']
        contrasena = request.form['contrasena'].encode('utf-8')  # Convertir a bytes
        nombreRol = 'Usuario'  # Asignar un rol predeterminado, como 'Usuario'

        # Encriptar la contraseña
        hashed_password = bcrypt.hashpw(contrasena, bcrypt.gensalt())

        connection = None
        try:
            connection = create_connection()
            cursor = connection.cursor()
            cursor.execute(
                "INSERT INTO usuario (nombre, email, contraseña, direccion, telefono, nombreRol) VALUES (%s, %s, %s, %s, %s, %s)",
                (nombre, email, hashed_password.decode('utf-8'), '', '', nombreRol)  # Almacenar la contraseña encriptada
            )
            connection.commit()
            flash("Usuario registrado con éxito. Por favor, inicia sesión.")  # Mensaje de éxito
            return redirect(url_for('login_controller.login'))  # Usar el blueprint y endpoint correcto
        except Error as e:
              # Mensaje de error
            return redirect(url_for('registro_controller.registro'))  # Usar el blueprint y endpoint correcto
        finally:
            if connection and connection.is_connected():
                cursor.close()
                connection.close()
    return render_template('registro.html')
from flask import Blueprint, render_template, request, redirect, url_for, flash
from mvc.model.db_connection import create_connection, close_connection
from mysql.connector import Error
import bcrypt  # Importar bcrypt
import re # Importar el módulo de expresiones regulares

registro_controller = Blueprint('registro_controller', __name__)

@registro_controller.route('/registro', methods=['GET', 'POST'])
def registro():

    from app import mail
    from flask_mail import Message

    if request.method == 'POST':
        nombre = request.form['nombre']
        email = request.form['email']
        contrasena = request.form['contrasena'].encode('utf-8')  # Convertir a bytes
        nombreRol = 'Usuario'  # Asignar un rol predeterminado, como 'Usuario'

        if not nombre.isalpha():
            flash('El nombre solo debe contener letras.', 'error')
            return redirect(url_for('registro_controller.registro'))
        
        
        if len(nombre) < 4:
            flash('El nombre debe tener al menos 4 caracteres.', 'error')
            return redirect(url_for('registro_controller.registro'))
        
        
        dominios_permitidos = ['@gmail.com', '@hotmail.com', '@yahoo.com', '@outlook.com', '@live.com', '@arp.edu.co']

        if len(email) < 5 or '@' not in email or not any(email.endswith(dominio) for dominio in dominios_permitidos):
            flash('Por favor, ingrese un correo electrónico válido' , 'error')
            return redirect(url_for('registro_controller.registro'))
        
        if len(contrasena) < 4 or not any(c in '!@#$%^&*()-_=+[]{}|;:,.<>?/' for c in contrasena.decode('utf-8')):
            flash('La contraseña debe tener al menos 4 caracteres y un carácter especial.', 'error')
            return redirect(url_for('registro_controller.registro'))
        
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

            msg = Message('Bienvenido a TearsOfMisery', recipients=[email])
            msg.html = render_template('registro_email.html', nombre=nombre, email=email)
            mail.send(msg)

            flash('Usuario registrado con éxito. Por favor, inicia sesión.', 'exito')  # Mensaje de éxito
            return redirect(url_for('login_controller.login'))  # Usar el blueprint y endpoint correcto
        
        except Error as e:
              # Mensaje de error
            flash('Hubo un error al registrar el usuario.', 'error')  
            return redirect(url_for('registro_controller.registro'))  # Usar el blueprint y endpoint correcto
        finally:
            if connection and connection.is_connected():
                cursor.close()
                connection.close()
    return render_template('registro.html')
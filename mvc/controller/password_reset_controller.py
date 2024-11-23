from flask import Blueprint, render_template, request, flash, redirect, url_for
from flask_mail import Message
import bcrypt
import random
import string
from mvc.model.db_connection import create_connection, close_connection

password_reset_controller = Blueprint('password_reset_controller', __name__)

def generate_random_password(length=8):
    """Genera una contraseña aleatoria."""
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for i in range(length))

@password_reset_controller.route('/reset-password', methods=['POST'])
def reset_password():
    email = request.form['email']
    
    from flask import current_app
    mail = current_app.extensions['mail']

    connection = create_connection()
    cursor = connection.cursor()

    # Buscar al usuario por correo electrónico
    cursor.execute("SELECT idUsuario FROM usuario WHERE email = %s", (email,))
    user = cursor.fetchone()

    if user:
        # Generar nueva contraseña
        nueva_contrasena = generate_random_password()
        hashed_password = bcrypt.hashpw(nueva_contrasena.encode('utf-8'), bcrypt.gensalt())

        # Actualizar la contraseña en la base de datos
        cursor.execute("UPDATE usuario SET contraseña = %s WHERE idUsuario = %s", (hashed_password.decode('utf-8'), user[0]))
        connection.commit()

         # Enviar correo electrónico con la nueva contraseña usando la plantilla
        msg = Message('Restablecimiento de contraseña', recipients=[email])
        msg.html = render_template('password_reset.html', nueva_contrasena=nueva_contrasena)
        mail.send(msg)

        flash('Se ha enviado un correo electrónico con tu nueva contraseña.', 'success')
    else:
        flash('No se encontró una cuenta con ese correo electrónico.', 'error')

    cursor.close()
    connection.close()

    return redirect(url_for('login_controller.login'))

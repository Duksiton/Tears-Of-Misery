from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from mvc.model.db_connection import create_connection, close_connection
from mysql.connector import Error
import bcrypt  # Importar bcrypt

login_controller = Blueprint('login_controller', __name__)

@login_controller.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        contrasena = request.form.get('contrasena').encode('utf-8')  # Convertir a bytes
        connection = None
        try:
            connection = create_connection()
            if not connection:
                flash("No se pudo conectar a la base de datos.")
                return redirect(url_for('login_controller.login'))
            
            cursor = connection.cursor()
            cursor.execute(
                "SELECT * FROM usuario WHERE email = %s",
                (email,)
            )
            result = cursor.fetchone()

            # Procesar resultados en formato de diccionario
            if result:
                columns = [col[0] for col in cursor.description]
                user = dict(zip(columns, result))
            else:
                user = None

            # Verifica si el usuario existe
            if user:
                # Verifica si la contraseña es correcta usando bcrypt
                if bcrypt.checkpw(contrasena, user['contraseña'].encode('utf-8')):
                    # Almacena el usuario en la sesión
                    session['user'] = user
                    session['idUsuario'] = user['idUsuario']
                    
                    # Redirige según el rol
                    if user['nombreRol'] == 'Administrador':
                        return redirect(url_for('producto_controller.admin'))  # Redirige al panel de administración
                    else:
                        return redirect(url_for('inicio'))  # Redirige a inicio.html
                else:
                    flash("Correo o contraseña incorrectos.")  # Mensaje para contraseña incorrecta
                    return redirect(url_for('login_controller.login'))
            else:
                flash("Correo o contraseña incorrectos.")  
                return redirect(url_for('login_controller.login'))

        except Error as e:
            flash(f"Error durante la conexión a la base de datos: {e}")
            return redirect(url_for('login_controller.login'))
        
        finally:
            if connection:
                cursor.close()
                connection.close()
    
    return render_template('login.html')

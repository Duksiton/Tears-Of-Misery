from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from mvc.model.db_connection import create_connection
import bcrypt
from mysql.connector import Error
from flask import jsonify, request


# Crear el blueprint para el controlador de perfil
perfil_controller = Blueprint('perfil', __name__, template_folder='templates/usuario')

@perfil_controller.route('/perfil', methods=['GET', 'POST'])
def perfil():
    idUsuario = session.get('idUsuario')
    
    if not idUsuario:
        return redirect(url_for('login_controller.login'))  # Redirige a iniciar sesión si no hay un usuario autenticado

    conn = create_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Consulta para obtener los datos del perfil del usuario
        query_perfil = "SELECT idUsuario, nombre, email, direccion, telefono FROM usuario WHERE idUsuario = %s"
        cursor.execute(query_perfil, (idUsuario,))
        perfil_data = cursor.fetchone()

        # Consulta para obtener el historial de compras del usuario
        query_compras = """
        SELECT idCompra, nombreProducto, imagenProducto, fechaCompra, cantidad, total, estado
        FROM historial_compras
        WHERE idUsuario = %s
        """
        cursor.execute(query_compras, (idUsuario,))
        compras = cursor.fetchall()

    except Exception as e:
        print('Error al obtener datos del perfil o historial de compras:', e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

    return render_template('usuario/perfil.html', perfil=perfil_data, compras=compras)


# Ruta para actualizar los datos del perfil
@perfil_controller.route('/perfil/actualizar', methods=['POST'])
def actualizar_perfil():
    user = session.get('user')
    if not user:
        return redirect(url_for('login_controller.login'))

    nombre = request.form.get('nombre')
    email = request.form.get('email')
    telefono = request.form.get('telefono')

    connection = create_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            UPDATE usuario
            SET nombre = %s, email = %s, telefono = %s
            WHERE idUsuario = %s
        """, (nombre, email, telefono, user['idUsuario']))

        connection.commit()

        # Actualizar los datos en la sesión
        session['user']['nombre'] = nombre
        session['user']['email'] = email
        session['user']['telefono'] = telefono

    except Error as e:
        flash(f"Error al actualizar el perfil: {e}", "danger")
    finally:
        cursor.close()
        connection.close()

    return redirect(url_for('perfil.perfil'))

# Ruta para cambiar la contraseña
@perfil_controller.route('/perfil/cambiar_contrasena', methods=['POST'])
def update_password():
    user = session.get('user')
    if not user:
        return jsonify({'success': False, 'message': 'No estás autenticado.'}), 401

    actual_password = request.form.get('actual-password')
    nueva_password = request.form.get('nueva-password')
    repetir_password = request.form.get('repetir-password')

    connection = create_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        # Verificar la contraseña actual
        cursor.execute("""
            SELECT contraseña FROM usuario WHERE idUsuario = %s
        """, (user['idUsuario'],))
        stored_password = cursor.fetchone()['contraseña']

        if not bcrypt.checkpw(actual_password.encode('utf-8'), stored_password.encode('utf-8')):
            return jsonify({'success': False, 'message': 'La contraseña actual es incorrecta.'}), 400

        # Verificar que las contraseñas nuevas coincidan
        if nueva_password != repetir_password:
            return jsonify({'success': False, 'message': 'Las contraseñas nuevas no coinciden.'}), 400

        # Actualizar la contraseña
        hashed_password = bcrypt.hashpw(nueva_password.encode('utf-8'), bcrypt.gensalt())
        cursor.execute("""
            UPDATE usuario
            SET contraseña = %s
            WHERE idUsuario = %s
        """, (hashed_password, user['idUsuario']))

        connection.commit()
        return jsonify({'success': True, 'message': 'Contraseña actualizada correctamente.'}), 200
    except Error as e:
        return jsonify({'success': False, 'message': f'Error al cambiar la contraseña: {e}'}), 500
    finally:
        cursor.close()
        connection.close()

# Ruta para añadir una nueva dirección
@perfil_controller.route('/perfil/añadir_direccion', methods=['POST'])
def add_direccion():
    user = session.get('user')
    if not user:
        return redirect(url_for('login_controller.login'))

    direccion = request.form.get('direccion')

    connection = create_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            UPDATE usuario
            SET direccion = %s
            WHERE idUsuario = %s
        """, (direccion, user['idUsuario']))

        connection.commit()
    except Error as e:
        flash(f"Error al actualizar la dirección: {e}", "danger")
    finally:
        cursor.close()
        connection.close()

    return redirect(url_for('perfil.perfil'))


# Ruta para eliminar un usuario
@perfil_controller.route('/perfil/eliminar_direccion/<int:idUsuario>', methods=['POST'])
def eliminar_direccion(idUsuario):
    user = session.get('user')
    if not user:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': 'No autorizado'}), 403
        return redirect(url_for('login_controller.login'))

    connection = create_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            UPDATE usuario
            SET direccion = NULL
            WHERE idUsuario = %s
        """, (idUsuario,))

        connection.commit()
        success = cursor.rowcount > 0
        message = 'Dirección eliminada con éxito.' if success else 'Dirección no encontrada o ya era NULL.'
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': success, 'message': message})
        
        flash(message, "success" if success else "warning")
        return redirect(url_for('perfil.perfil'))
        
    except Error as e:
        message = f"Error al eliminar la dirección: {e}"
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': message}), 500
        flash(message, "danger")
        return redirect(url_for('perfil.perfil'))
    finally:
        cursor.close()
        connection.close()



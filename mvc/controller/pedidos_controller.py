import datetime
from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from mvc.model.db_connection import create_connection
from mysql.connector import Error

pedidos_controller = Blueprint('pedidos_controller', __name__)

@pedidos_controller.route('/ver_pedidos')
def ver_pedidos():
    idUsuario = session.get('idUsuario')

    if not idUsuario:
        return redirect(url_for('login_controller.login'))

    conn = create_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        query = """
        SELECT idCompra AS idPedido, fechaCompra AS fechaPedido, nombre AS usuario, total AS totalPedido, estado
        FROM historial_compras
        INNER JOIN usuario ON historial_compras.idUsuario = usuario.idUsuario
        WHERE historial_compras.idUsuario = %s
        """
        cursor.execute(query, (idUsuario,))
        pedidos = cursor.fetchall()
    except Exception as e:
        print('Error al obtener historial de pedidos:', e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

    return render_template('admin/pedidos.html', pedidos=pedidos)

@pedidos_controller.route('/editar_estado_pedido', methods=['POST'])
def editar_estado_pedido():
    idPedido = request.form.get('idPedido')
    estado = request.form.get('estado')

    print(f'Recibido idPedido: {idPedido}, estado: {estado}, idUsuario: {id_usuario}')  # Depuración

    if not idPedido or not estado or not id_usuario:
        return jsonify({'success': False, 'message': 'Datos incompletos'}), 400

    conn = create_connection()
    cursor = conn.cursor()

    try:
        # Actualizar el estado del pedido en la base de datos
        query = """
        UPDATE historial_compras
        SET estado = %s
        WHERE idCompra = %s
        """
        cursor.execute(query, (estado, idPedido))
        conn.commit()

        # Obtener el idUsuario asociado al pedido
        cursor.execute('SELECT idUsuario FROM historial_compras WHERE idCompra = %s', (idPedido,))
        id_usuario_result = cursor.fetchone()

        if not id_usuario_result:
            return jsonify({'success': False, 'message': 'No se encontró el usuario asociado al pedido'}), 404

        id_usuario = id_usuario_result[0]
        print(f"idUsuario: {id_usuario}")

        # Obtener el correo del usuario
        cursor.execute('SELECT email FROM usuario WHERE idUsuario = %s', (id_usuario,))
        usuario = cursor.fetchone()

        if not usuario:
            return jsonify({'success': False, 'message': 'Correo del usuario no encontrado'}), 404

        email = usuario[0]
        print(f"Email del usuario: {email}")

        # Enviar correo de notificación
        enviar_correo_actualizacion(email, estado)

        return jsonify({'success': True, 'message': 'Estado del pedido actualizado y correo enviado'})

    except Error as e:
        print('Error al actualizar el estado del pedido:', e)
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

def enviar_correo_actualizacion(email, estado):
    """
    Función para enviar un correo cuando el estado de un pedido cambia.
    """
    from app import mail
    from flask_mail import Message

    try:
        msg = Message('Actualización de Estado de Pedido', recipients=[email])
        msg.body = f'El estado de tu pedido ha cambiado a: {estado}.'
        mail.send(msg)
        print(f"Correo enviado a: {email}")  # Confirmación de envío

    except Exception as e:
        print(f'Error al enviar el correo: {e}')
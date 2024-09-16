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

    print(f'Recibido idPedido: {idPedido}, estado: {estado}')  # Depuración

    if not idPedido or not estado:
        return jsonify({'success': False, 'message': 'Datos incompletos'}), 400

    conn = create_connection()
    cursor = conn.cursor()

    try:
        query = """
        UPDATE historial_compras
        SET estado = %s
        WHERE idCompra = %s
        """
        cursor.execute(query, (estado, idPedido))
        conn.commit()
        return jsonify({'success': True, 'message': 'Estado del pedido actualizado'})
    except Error as e:
        print('Error al actualizar el estado del pedido:', e)
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

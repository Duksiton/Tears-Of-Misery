from flask import Blueprint, request, jsonify, session
from mvc.model.db_connection import create_connection, close_connection

compras_controller = Blueprint('compras_controller', __name__)

@compras_controller.route('/api/guardar_compra', methods=['POST'])
def guardar_compra():
    if 'idUsuario' not in session:
        return jsonify({'success': False, 'message': 'Usuario no logueado'}), 401

    data = request.json
    id_usuario = session['idUsuario']
    productos = data.get('productos', [])
    total = data.get('total', 0)
    fecha_compra = data.get('fechaCompra', '')

    if not productos:
        return jsonify({'success': False, 'message': 'No hay productos en la compra'}), 400

    conn = create_connection()
    cursor = conn.cursor()

    try:
        # Creamos una lista para almacenar los productos
        productos_compra = []

        for producto in productos:
            id_producto = producto.get('idProducto')
            nombre_producto = producto.get('nombreProducto', '')
            imagen_producto = producto.get('imagenProducto', '')
            cantidad = producto.get('cantidad', 0)
            total_producto = producto.get('total', 0)

            # Formatear el total del producto a 3 decimales
            total_producto_formateado = f"{total_producto:,.3f}".replace(",", ".")

            productos_compra.append({
                'nombre': nombre_producto,
                'cantidad': cantidad,
                'total': total_producto_formateado
            })

            cursor.execute(''' 
                INSERT INTO historial_compras (idUsuario, idProducto, nombreProducto, imagenProducto, fechaCompra, cantidad, total)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''', (id_usuario, id_producto, nombre_producto, imagen_producto, fecha_compra, cantidad, total_producto))

        conn.commit()

        # Formatear el total general de la compra a 3 decimales
        total_formateado = f"{total:,.3f}".replace(",", ".")

        # Llamar a la función para enviar el correo y pasarle los productos y el total formateados
        send_confirmation_email(id_usuario, total_formateado, productos_compra)

        return jsonify({'success': True, 'message': 'Compra guardada exitosamente'}), 200

    except Exception as e:
        conn.rollback()
        print(f'Error: {e}')
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        close_connection(conn)



def send_confirmation_email(id_usuario, total_formateado, productos_compra):
    conn = create_connection()
    cursor = conn.cursor()

    from app import mail
    from flask_mail import Message

    try:
        # Obtener el correo y nombre del usuario a partir del ID
        cursor.execute('SELECT email, nombre FROM usuario WHERE idUsuario = %s', (id_usuario,))
        usuario = cursor.fetchone()

        if usuario:
            email = usuario[0]  # Suponiendo que el correo es el primer campo
            nombre = usuario[1]  # Suponiendo que el nombre es el segundo campo

            # Cargar el archivo HTML
            with open('templates/confirmation_email.html', 'r', encoding='utf-8') as file:
                html_body = file.read()

            # Reemplazar los placeholders con los valores reales
            html_body = html_body.replace('{{ nombre }}', nombre)

            # Reemplazar el total formateado
            html_body = html_body.replace('{{ total }}', total_formateado)

            # Crear la lista de productos para el correo
            productos_html = ""
            for producto in productos_compra:
                productos_html += f"<li>{producto['nombre']} (Cantidad: {producto['cantidad']}) - Total: {producto['total']}</li>"

            # Insertar la lista de productos en el HTML
            html_body = html_body.replace('{{ productos }}', productos_html)

            # Configurar el mensaje de correo
            msg = Message('Confirmación de Compra',
                          recipients=[email],
                          html=html_body)

            msg.body = f'Tu compra ha sido realizada exitosamente. Total: {total_formateado}'
            mail.send(msg)
        else:
            print("Usuario no encontrado.")

    except Exception as e:
        print(f'Error al enviar el correo: {e}')
    finally:
        cursor.close()
        close_connection(conn)




@compras_controller.route('/api/verificar_stock', methods=['POST'])
def verificar_stock():
    data = request.json
    id_producto = data.get('idProducto')
    talla = data.get('talla')
    cantidad_solicitada = data.get('cantidad')

    if not id_producto or not talla:
        return jsonify({'success': False, 'message': 'Faltan datos del producto'}), 400

    conn = create_connection()
    cursor = conn.cursor()

    try:
        # Consultar el stock actual del producto y la talla
        cursor.execute('''
            SELECT stock FROM producto_tallas WHERE idProducto = %s AND talla = %s
        ''', (id_producto, talla))
        resultado = cursor.fetchone()

        if not resultado:
            return jsonify({'success': False, 'message': 'Producto o talla no encontrada'}), 404

        stock_actual = resultado[0]

        if cantidad_solicitada > stock_actual:
            return jsonify({'success': False, 'message': 'No hay suficiente stock disponible', 'stock_disponible': stock_actual}), 400

        return jsonify({'success': True, 'stock_disponible': stock_actual}), 200

    except Exception as e:
        print(f'Error al verificar el stock: {e}')
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500

    finally:
        cursor.close()
        close_connection(conn)


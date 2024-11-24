# Importaciones
import shutil
from flask import Blueprint, app, render_template, abort, flash, request, redirect, url_for, jsonify
from werkzeug.utils import secure_filename
import os
from mvc.model.db_connection import create_connection, close_connection

# Registro del blueprint producto_controller
producto_controller = Blueprint('producto_controller', __name__)

# Vista de productos
@producto_controller.route('/admin', methods=['GET'])
def admin():
    conn = create_connection()
    if conn is None:
        flash("Error de conexión a la base de datos")
        abort(500, description="Error de conexión a la base de datos")
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT p.idProducto, p.nombre, p.descripcion, p.precio, p.idCat, p.imagen, c.nombre AS categoria,
                   GROUP_CONCAT(CONCAT(pt.talla, ':', pt.stock) SEPARATOR ', ') AS tallas_stock
            FROM producto p
            LEFT JOIN categoria c ON p.idCat = c.idCat
            LEFT JOIN producto_tallas pt ON p.idProducto = pt.idProducto
            GROUP BY p.idProducto, p.nombre, p.descripcion, p.precio, p.idCat, p.imagen, c.nombre
        """)
        productos = cursor.fetchall()
       
    except Exception as e:
       
        productos = []
    finally:
        cursor.close()
        close_connection(conn)
    return render_template('admin/admin.html', productos=productos)

# Agregar producto
@producto_controller.route('/add_product', methods=['POST'])
def add_product():
    if 'imagen' not in request.files:
      
        return redirect(url_for('producto_controller.admin'))
    
    imagen = request.files['imagen']
    nombre = request.form['nombre']
    descripcion = request.form['descripcion']
    precio = float(request.form['precio'])
    idCat = int(request.form['idCat'])
    
    # Guardar imagen
    if imagen.filename == '':
       
        return redirect(url_for('producto_controller.admin'))
    
    filename = secure_filename(imagen.filename)
    imagen_path = os.path.join('static/images/productos-insertados', filename)
    imagen.save(imagen_path)

    # Guardar la imagen en la segunda ubicación
    imagen_path_historial = os.path.join('static/images/historial', filename)
    shutil.copy2(imagen_path, imagen_path_historial)
    
    conn = create_connection()
    if conn is None:
        flash("Error de conexión a la base de datos")
        return redirect(url_for('producto_controller.admin'))
    
    try:
        cursor = conn.cursor()
        # Insertar producto sin stock ni talla (esto lo manejas en la tabla separada)
        cursor.execute("""
            INSERT INTO producto (nombre, descripcion, precio, idCat, imagen) 
            VALUES (%s, %s, %s, %s, %s)
        """, (nombre, descripcion, precio, idCat, filename))
        
        idProducto = cursor.lastrowid  # Obtener el ID del producto recién insertado
        
        # Insertar tallas y su stock si están seleccionadas
        tallas = ['S', 'M', 'L', 'XL']
        for talla in tallas:
            if talla in request.form.getlist('tallas'):  # Si la talla está seleccionada
                stock = int(request.form.get(f'stock{talla}', 0))  # Obtener el stock correspondiente
                if stock > 0:  # Solo insertar si el stock es mayor que 0
                    cursor.execute("""
                        INSERT INTO producto_tallas (idProducto, talla, stock)
                        VALUES (%s, %s, %s)
                    """, (idProducto, talla, stock))
        
        conn.commit()
        
     
    except Exception as e:
        conn.rollback()
       
    finally:
        cursor.close()
        close_connection(conn)
    
    return redirect(url_for('producto_controller.admin'))


# Obtener un producto y renderizar la plantilla
@producto_controller.route('/producto/<int:id>', methods=['GET'])
def producto(id):
    conn = create_connection()
    if conn is None:
        flash("Error de conexión a la base de datos")
        abort(500, description="Error de conexión a la base de datos")
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Obtener los datos del producto
        cursor.execute("SELECT * FROM producto WHERE idProducto = %s", (id,))
        producto = cursor.fetchone()
        
        if producto:
            # Formatear el precio sin decimales
            producto['precio'] = f"{int(producto['precio']):,.0f}".replace(',', 'X').replace('.', ',').replace('X', '.')
            
            # Obtener tallas y stock
            cursor.execute("SELECT talla, stock FROM producto_tallas WHERE idProducto = %s", (id,))
            tallas_stock = cursor.fetchall()
            
            # Convertir tallas_stock a un diccionario
            tallas_stock_dict = {item['talla']: item['stock'] for item in tallas_stock}
            producto['tallas_stock'] = tallas_stock_dict

            # Retornar la plantilla con los datos del producto
            return render_template('usuario/producto.html', producto=producto)  
            
        else:
            # Redirigir si no se encuentra el producto
            return redirect(url_for('producto_controller.catalogo'))  
            
    except Exception as e:
        # Manejo de errores
        print(f"Error al obtener los datos del producto: {e}")
        abort(500, description="Error al obtener los datos del producto")
        
    finally:
        # Cerrar el cursor y la conexión
        cursor.close()
        close_connection(conn)

  # Asegúrate de que el nombre de la plantilla sea correcto

# Controlador del catálogo
@producto_controller.route('/catalogo', methods=['GET'])
def catalogo():
    conn = create_connection()
    if conn is None:
        flash("Error de conexión a la base de datos")
        abort(500, description="Error de conexión a la base de datos")
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM producto")
        productos = cursor.fetchall()

        # Formatear el precio de cada producto
        for producto in productos:
            # Formatear el precio sin decimales
            producto['precio'] = f"{int(producto['precio']):,.0f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        
    except Exception as e:
        
        productos = []
    finally:
        cursor.close()
        close_connection(conn)
    
    return render_template('usuario/catalogo.html', productos=productos)


@producto_controller.route('/producto/<int:id>', methods=['GET'])
def obtener_producto(id):
    conn = create_connection()
    if conn is None:
        return jsonify({'error': 'Error de conexión a la base de datos'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM producto WHERE idProducto = %s", (id,))
        producto = cursor.fetchone()
        if producto:
            data = {
                'idProducto': producto[0],
                'nombre': producto[1],
                'descripcion': producto[2],
                'precio': producto[4],
                'stock': producto[5],
                'imagen': producto[6]
            }
            return jsonify(data)
        else:
            return jsonify({'error': 'Producto no encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        close_connection(conn)


@producto_controller.route('/producto/<int:id>')
def get_producto(id):
    conn = create_connection()
    if conn is None:
        return jsonify({"error": "Error de conexión a la base de datos"}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM producto WHERE idProducto = %s", (id,))
        producto = cursor.fetchone()
        if producto:
            return jsonify(producto)
        else:
            return jsonify({"error": "Producto no encontrado"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        close_connection(conn)



# Actualizamos productos
@producto_controller.route('/update_product/<int:id>', methods=['POST'])
def update_product(id):
    conn = create_connection()
    if conn is None:
        return jsonify({'success': False, 'error': "Error de conexión a la base de datos"}), 500

    try:
        cursor = conn.cursor()
        file = request.files.get('imagen')
        nombre = request.form.get('nombre')
        descripcion = request.form.get('descripcion')
        precio = request.form.get('precio')
        idCat = request.form.get('idCat')
        talla = request.form.get('talla')
        stock = request.form.get('stock')
        imagen_actual = request.form.get('imagenActual')

        # Primero, obtenemos la información actual del producto
        cursor.execute("SELECT imagen FROM producto WHERE idProducto = %s", (id,))
        producto_actual = cursor.fetchone()
        imagen_original = producto_actual[0] if producto_actual else None

        if file and file.filename:
            # Si se subió una nueva imagen, se usa esa
            filename = file.filename
        elif imagen_actual:
            # Si no se subió una nueva imagen pero hay una imagen actual, mantenemos esa
            filename = imagen_actual
        else:
            # Si no hay nueva imagen ni imagen actual, mantenemos la original
            filename = imagen_original

        print(f"Actualizando producto {id}. Imagen: {filename}")  # Log para depuración

        cursor.execute("""
            UPDATE producto SET nombre = %s, descripcion = %s, precio = %s, imagen = %s, idCat = %s
            WHERE idProducto = %s
        """, (nombre, descripcion, precio, filename, idCat, id))
        
        # Actualización de tallas y stock
        if talla and stock:
            # Primero, eliminamos las tallas y stock existentes para este producto
            cursor.execute("DELETE FROM producto_tallas WHERE idProducto = %s", (id,))

            # Luego, insertamos las nuevas tallas y stock
            tallas = talla.split(',')
            stocks = stock.split(',')
            
            for t, s in zip(tallas, stocks):
                cursor.execute("""
                    INSERT INTO producto_tallas (idProducto, talla, stock)
                    VALUES (%s, %s, %s)
                """, (id, t.strip(), int(s.strip())))

        conn.commit()
        return jsonify({'success': True, 'message': "Producto actualizado correctamente"})

    except Exception as e:
        print(f"Error al actualizar el producto: {str(e)}")  # Log para depuración
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        cursor.close()
        close_connection(conn)




@producto_controller.route('/producto/data/<int:id>', methods=['GET'])
def get_producto_data(id):
    conn = create_connection()
    if conn is None:
        return jsonify({'error': 'Error de conexión a la base de datos'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT p.nombre, p.descripcion, p.precio, p.imagen, c.nombre AS categoriaNombre
            FROM producto p
            LEFT JOIN categoria c ON p.idCat = c.idCat
            WHERE p.idProducto = %s
        """, (id,))
        producto = cursor.fetchone()

        if not producto:
            return jsonify({'error': 'Producto no encontrado'}), 404
        
        # Obtener tallas y stock
        cursor.execute("""
            SELECT talla, stock FROM producto_tallas
            WHERE idProducto = %s
        """, (id,))
        tallas_stock = cursor.fetchall()

        producto['tallas_stock'] = tallas_stock

    except Exception as e:
        print(f"Error al obtener los datos del producto: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        close_connection(conn)

    return jsonify(producto)




# Eliminamos productos
@producto_controller.route('/delete_product/<int:id>', methods=['POST'])
def delete_product(id):
    conn = create_connection()
    if conn is None:
        flash("Error de conexión a la base de datos")
        return redirect(url_for('producto_controller.admin'))

    try:
        cursor = conn.cursor()

        # Primero obtenemos la imagen actual del producto para eliminarla si es necesario
        cursor.execute("SELECT imagen FROM producto WHERE idProducto = %s", (id,))
        producto = cursor.fetchone()

        if producto:
            imagen = producto[0]
            if imagen and imagen != "default.jpg":  # Verifica que la imagen no sea una predeterminada
                # Elimina la imagen del servidor
                os.remove(os.path.join('static', 'images', 'productos-insertados', imagen))

            # Luego, eliminamos el producto de la base de datos
            cursor.execute("DELETE FROM producto WHERE idProducto = %s", (id,))
            conn.commit()
          
        else:
            flash("Producto no encontrado")

    except Exception as e:
        flash(f"Error al eliminar el producto: {str(e)}")
    finally:
        cursor.close()
        close_connection(conn)

    return redirect(url_for('producto_controller.admin'))


from flask import Flask, render_template, flash, abort
import os
from dotenv import load_dotenv
import mysql.connector

# Cargar variables de entorno
load_dotenv()

# Configuración de la aplicación Flask
app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'tearsofmiseryconexion')

# Configuración de la base de datos
def create_connection():
    try:
        return mysql.connector.connect(
            host=os.getenv("MYSQL_HOST", "autorack.proxy.rlwy.net"),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", "ZSOWJGjemzeQLMBMkAEKaIJIwbZWECwA"),
            database=os.getenv("MYSQL_DB", "Tears of Misery"),
            port=int(os.getenv("MYSQL_PORT", 35827)),
        )
    except Exception as e:
        app.logger.error(f"Error al crear la conexión: {e}")
        return None

def close_connection(connection):
    if connection:
        try:
            connection.close()
        except Exception as e:
            app.logger.error(f"Error al cerrar la conexión: {e}")

# Ruta para mostrar los productos
@app.route('/productos', methods=['GET'])
def mostrar_productos_invitado():
    try:
        conn = create_connection()
        if conn is None:
            flash("Error de conexión a la base de datos")
            abort(500, description="Error de conexión a la base de datos")

        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM producto")
        productos = cursor.fetchall()

        # Formatear el precio de cada producto
        for producto in productos:
            producto['precio'] = f"{int(producto['precio']):,.0f}".replace(',', 'X').replace('.', ',').replace('X', '.')

    except Exception as e:
        app.logger.error(f"Error en mostrar_productos_invitado: {e}")
        productos = []  # Devolver una lista vacía si hay un error
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conn:
            close_connection(conn)

    return render_template('productos.html', productos=productos)



# Ruta de prueba para la conexión a la base de datos
@app.route('/test_db')
def test_db():
    try:
        conn = create_connection()
        if conn:
            return "Conexión exitosa a la base de datos."
        else:
            return "Error al conectar con la base de datos.", 500
    except Exception as e:
        return f"Error al conectar: {e}", 500
    finally:
        if conn:
            close_connection(conn)

if __name__ == '__main__':
    app.run(debug=True)






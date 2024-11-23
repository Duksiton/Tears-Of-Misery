#Importaciones
import logging
from flask import Blueprint, render_template, request, redirect, session, url_for, flash, abort, jsonify
from mvc.model.db_connection import create_connection, close_connection
import bcrypt

#Agregamos el blueprint de usuarios_controller
usuarios_controller = Blueprint('usuarios_controller', __name__)

#Listamos usuarios para su visualización 
@usuarios_controller.route('/usuarios', methods=['GET'])
def listar_usuarios():
    conn = create_connection()
    if conn is None:
        flash("Error de conexión a la base de datos")
        abort(500, description="Error de conexión a la base de datos")
    
    usuarios = []  # Inicializa usuarios para asegurar que siempre tenga un valor
    cursor = None  # Inicializa cursor de forma segura
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT idUsuario, nombre, email, contraseña AS contrasena, direccion, telefono, nombreRol
            FROM usuario
        """)
        usuarios = cursor.fetchall()
        if not usuarios:
            flash("No se encontraron usuarios.")
           
    except Exception as e:
        logging.error(f"Error al obtener los usuarios: {e}")
        flash("Ocurrió un error al obtener los usuarios.")
        
    finally:
        if cursor:
            cursor.close()
        close_connection(conn)
    
    return render_template('admin/users.html', usuarios=usuarios)



@usuarios_controller.route('/verificar_usuario', methods=['GET', 'POST'])
def verificar_usuario():
    if 'user' not in session:
        return redirect(url_for('login'))

    user = session['user']
    user_id = user.get('idUsuario')

    if request.method == 'POST':
        nombre = request.form.get('nombre')
        correo = request.form.get('correo')
        telefono = request.form.get('telefono')
        direccion = request.form.get('direccion')

        conn = create_connection()
        if conn is None:
            return jsonify({"success": False, "message": "Error de conexión a la base de datos"}), 500

        try:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE usuario
                SET nombre = %s, email = %s, telefono = %s, direccion = %s
                WHERE idUsuario = %s
            """, (nombre, correo, telefono, direccion, user_id))
            conn.commit()

            # Actualizar la sesión con los nuevos datos
            user['nombre'] = nombre
            user['email'] = correo
            user['telefono'] = telefono
            user['direccion'] = direccion
            session['user'] = user

            return jsonify({"success": True}), 200
        except Exception as e:
            print(f"Error al actualizar los datos: {e}")
            return jsonify({"success": False, "message": "Error al actualizar los datos."}), 500
        finally:
            # Verificamos si el cursor y la conexión fueron inicializados antes de cerrarlos
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                close_connection(conn)

    # Código para la parte GET
    conn = create_connection()
    if conn is None:
        abort(500, description="Error de conexión a la base de datos")

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT idUsuario, nombre, email, telefono, direccion
            FROM usuario
            WHERE idUsuario = %s
        """, (user_id,))
        usuario = cursor.fetchone()
        if not usuario:
            abort(404)
    except Exception as e:
        print(f"Error al obtener usuario: {e}")
        usuario = {}
    finally:
        # Verificamos si el cursor y la conexión fueron inicializados antes de cerrarlos
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            close_connection(conn)

    return render_template('usuario/verificacion.html', user=usuario)









#Obtenemos productos para organizarlos en listas
@usuarios_controller.route('/usuarios/<int:id>', methods=['GET'])
def get_user(id):
    conn = create_connection()
    if conn is None:
        return jsonify({"error": "Error de conexión a la base de datos"}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT nombre, email, contraseña AS contrasena, direccion, telefono, nombreRol
            FROM usuario
            WHERE idUsuario = %s
        """, (id,))
        user = cursor.fetchone()
        if user:
            user_data = {
                "nombre": user[0],
                "email": user[1],
                "contraseña": user[2],
                "direccion": user[3],
                "telefono": user[4],
                "nombreRol": user[5]
            }
            return jsonify(user_data)
        else:
            return jsonify({"error": "Usuario no encontrado"}), 404
    except Exception as e:
        print(f"Error al obtener el usuario: {str(e)}")
        return jsonify({"error": "Error al obtener el usuario"}), 500
    finally:
        cursor.close()
        close_connection(conn)

#Agregamos usuarios
@usuarios_controller.route('/usuarios/add', methods=['GET', 'POST'])
def agregar_usuario():
    if request.method == 'POST':
        nombre = request.form['nombre']
        email = request.form['email']
        contraseña = request.form['contraseña']
        direccion = request.form['direccion']
        telefono = request.form['telefono']
        nombreRol = request.form['nombreRol']
        
        # Encriptar la contraseña
        hashed_contraseña = bcrypt.hashpw(contraseña.encode('utf-8'), bcrypt.gensalt())

        conn = create_connection()
        if conn is None:
            flash("Error de conexión a la base de datos")
            abort(500, description="Error de conexión a la base de datos")
        
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO usuario (nombre, email, contraseña, direccion, telefono, nombreRol)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (nombre, email, hashed_contraseña, direccion, telefono, nombreRol))
            conn.commit()

            return redirect(url_for('usuarios_controller.listar_usuarios'))
        except Exception as e:
           
            conn.rollback()
        finally:
            cursor.close()
            close_connection(conn)
    
    return render_template('admin/users.html')

#Actualizamos usuarios
@usuarios_controller.route('/update_user/<int:id>', methods=['POST'])
def update_user(id):
    conn = create_connection()
    if conn is None:
        flash("Error de conexión a la base de datos")
        return redirect(url_for('usuarios_controller.listar_usuarios'))

    try:
        cursor = conn.cursor()
        nombre = request.form.get('nombre')
        email = request.form.get('email')
        contraseña = request.form.get('contraseña')
        direccion = request.form.get('direccion')
        telefono = request.form.get('telefono')
        nombreRol = request.form.get('nombreRol')

        # Solo encriptar la contraseña si no está vacía
        if contraseña:
            hashed_contraseña = bcrypt.hashpw(contraseña.encode('utf-8'), bcrypt.gensalt())
        else:
            # Obtener la contraseña actual si no se cambia
            cursor.execute("SELECT contraseña FROM usuario WHERE idUsuario = %s", (id,))
            hashed_contraseña = cursor.fetchone()[0]
        
        cursor.execute("""
            UPDATE usuario SET nombre = %s, email = %s, contraseña = %s, direccion = %s, telefono = %s, nombreRol = %s
            WHERE idUsuario = %s
        """, (nombre, email, hashed_contraseña, direccion, telefono, nombreRol, id))
        
        conn.commit()
        
    except Exception as e:
        print(f"Error al actualizar el usuario: {str(e)}")
       
    finally:
        cursor.close()
        close_connection(conn)
    
    return redirect(url_for('usuarios_controller.listar_usuarios'))

#Eliminamos usuarios
@usuarios_controller.route('/delete_user/<int:id>', methods=['POST'])
def delete_user(id):
    conn = create_connection()
    if conn is None:
        flash("Error de conexión a la base de datos")
        return redirect(url_for('usuarios_controller.listar_usuarios'))

    try:
        cursor = conn.cursor()

        # Eliminamos el usuario de la base de datos
        cursor.execute("DELETE FROM usuario WHERE idUsuario = %s", (id,))
        conn.commit()
     
    except Exception as e:
        print(f"Error al eliminar el usuario: {str(e)}")  # Log para depuración
        
    finally:
        cursor.close()
        close_connection(conn)

    return redirect(url_for('usuarios_controller.listar_usuarios'))

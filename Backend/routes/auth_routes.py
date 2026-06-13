from flask import Blueprint, request, jsonify
from db_connection import db
import logging
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
import smtplib
from email.mime.text import MIMEText
import re

bp = Blueprint('auth', __name__, url_prefix='/api/auth')
logger = logging.getLogger(__name__)


# -------------------------------------------------------
# LOGIN
# -------------------------------------------------------
@bp.route('/login', methods=['POST'])
def login():
    """Endpoint de login - Verifica usuario y contraseña"""
    try:
        data = request.get_json()
        usuario = data.get('usuario')
        password_plana = data.get('password')

        if not usuario or not password_plana:
            return jsonify({'error': 'Usuario y contraseña requeridos'}), 400

        # Traer datos del usuario
        query = """
                SELECT Id, NombreUsuario, NombreCompleto, Cargo, NivelAcceso, ContrasenaHash
                FROM Usuarios
                WHERE NombreUsuario = ? \
                """
        result = db.execute_query(query, (usuario,))

        if not result:
            return jsonify({'error': 'Usuario o contraseña incorrectos'}), 401

        user = result[0]
        hash_guardado = user.get('ContrasenaHash')

        if not hash_guardado:
            logger.error("ERROR: La columna ContrasenaHash no existe o es None")
            return jsonify({'error': 'Error interno (hash no encontrado)'}), 500

        # Validación de la contraseña
        if not check_password_hash(hash_guardado, password_plana):
            return jsonify({'error': 'Usuario o contraseña incorrectos'}), 401

        # Login exitoso
        return jsonify({
            'success': True,
            'usuario': {
                'id': user.get('Id'),
                'usuario': user.get('NombreUsuario'),
                'nombre': user.get('NombreCompleto'),
                'cargo': user.get('Cargo'),
                'nivelAcceso': user.get('NivelAcceso'),
            }
        }), 200

    except Exception as e:
        logger.exception(f"Error en login: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


# -------------------------------------------------------
# LOGOUT
# -------------------------------------------------------
@bp.route('/logout', methods=['POST'])
def logout():
    try:
        return jsonify({'success': True, 'message': 'Sesión cerrada con éxito'}), 200
    except Exception as e:
        logger.error(f"Error al cerrar sesión: {e}")
        return jsonify({'error': 'Error al cerrar sesión'}), 500


# -------------------------------------------------------
# REGISTRO
# -------------------------------------------------------
@bp.route('/registro', methods=['POST'])
def registro():
    """Registro de nuevo usuario"""
    try:
        data = request.get_json()
        nombre_usuario_frontend = data.get('usuario')
        contrasena_frontend = data.get('contrasena')
        dni_frontend = data.get('dni')
        correo_frontend = data.get('correo')

        # Validación de DNI (8 caracteres)
        dni_limpio = str(dni_frontend or '').strip().upper()
        if not re.match(r"^[A-Z0-9]{8}$", dni_limpio):
            return jsonify({
                'error': 'El DNI debe tener exactamente 8 caracteres'
            }), 400
        dni_frontend = dni_limpio

        # Verificar nombre de usuario
        result_check = db.execute_query(
            "SELECT 1 FROM Usuarios WHERE NombreUsuario = ?",
            (nombre_usuario_frontend,)
        )
        if result_check:
            return jsonify({'error': 'El nombre de usuario ya está en uso'}), 400

        # Verificar DNI
        result_check = db.execute_query(
            "SELECT 1 FROM Usuarios WHERE DNI = ?",
            (dni_frontend,)
        )
        if result_check:
            return jsonify({'error': 'El número de DNI ya está en uso'}), 400

        # Verificar correo
        result_check = db.execute_query(
            "SELECT 1 FROM Usuarios WHERE Correo = ?",
            (correo_frontend,)
        )
        if result_check:
            return jsonify({'error': 'El correo ya está en uso'}), 400

        # Insertar nuevo usuario
        query = """
                INSERT INTO Usuarios
                (NombreCompleto, DNI, Cargo, NivelAcceso, NombreUsuario, ContrasenaHash, Correo)
                VALUES (?, ?, ?, ?, ?, ?, ?) \
                """
        params = (
            data.get('nombreCompleto'),
            dni_frontend,
            data.get('cargo'),
            data.get('nivelAcceso'),
            nombre_usuario_frontend,
            generate_password_hash(contrasena_frontend),
            correo_frontend
        )
        db.execute_update(query, params)
        return jsonify({'success': True, 'message': 'Usuario creado'}), 201
    except Exception as e:
        logger.error(f"Error en registro: {e}")
        return jsonify({'error': str(e)}), 500


# -------------------------------------------------------
# RECUPERAR CONTRASEÑA
# -------------------------------------------------------
@bp.route('/recuperar', methods=['POST'])
def recuperar():
    try:
        data = request.get_json()
        correo = data.get("correo")

        # DEBUG: Log para ver qué está llegando
        logger.info(f"Datos recibidos en recuperar: {data}")

        if not correo:
            return jsonify({"error": "Correo requerido"}), 400

        # Verificar si existe el usuario
        query = "SELECT Id, NombreCompleto FROM Usuarios WHERE Correo = ?"
        result = db.execute_query(query, (correo,))

        if not result:
            return jsonify({"error": "No existe un usuario con ese correo"}), 404

        usuario_id = result[0]["Id"]
        nombre_usuario = result[0]["NombreCompleto"]

        # Generar token seguro
        token = secrets.token_urlsafe(32)

        # Guardarlo en la BD
        db.execute_update(
            "UPDATE Usuarios SET TokenRecuperacion = ?, TokenExpira = DATEADD(hour, 1, GETDATE()) WHERE Id = ?",
            (token, usuario_id)
        )

        # DEBUG: Log del token generado
        logger.info(f"Token generado para {correo}: {token}")

        # Para desarrollo, puedes retornar el token en la respuesta
        return jsonify({
            "success": True,
            "message": "Correo de recuperación enviado",
            "token": token  # Solo para desarrollo, quitar en producción
        }), 200

    except Exception as e:
        logger.error(f"Error en recuperar: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500


# -------------------------------------------------------
# RESET PASSWORD
# -------------------------------------------------------
@bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        token = data.get("token")
        nueva = data.get("nueva")

        query = """
                SELECT Id
                FROM Usuarios
                WHERE TokenRecuperacion = ?
                AND TokenExpira > GETDATE() \
                """
        result = db.execute_query(query, (token,))

        if not result:
            return jsonify({"error": "Token inválido o expirado"}), 400

        usuario_id = result[0]["Id"]

        db.execute_update(
            """
            UPDATE Usuarios
            SET ContrasenaHash    = ?,
                TokenRecuperacion = NULL,
                TokenExpira       = NULL
            WHERE Id = ?
            """,
            (generate_password_hash(nueva), usuario_id)
        )
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------------
# FUNCIÓN PARA ENVIAR CORREO
# -------------------------------------------------------
def enviar_correo(to, subject, mensaje):
    msg = MIMEText(mensaje)
    msg["Subject"] = subject
    msg["From"] = "tu_correo@gmail.com"
    msg["To"] = to
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login("tu_correo@gmail.com", "tu_clave_de_app")
        server.send_message(msg)

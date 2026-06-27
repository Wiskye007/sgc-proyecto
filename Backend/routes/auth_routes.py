from flask import Blueprint, request, jsonify
from db_connection import db
import logging
from werkzeug.security import generate_password_hash, check_password_hash
from auth_utils import generar_token
import secrets
import smtplib
import os
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

        # 1. Traer TODOS los datos del usuario
        query = "SELECT * FROM Usuarios WHERE NombreUsuario = %s"
        result = db.execute_query(query, (usuario,))

        if not result:
            return jsonify({'error': 'Usuario o contraseña incorrectos'}), 401

        # 2. Convertir todas las llaves a minúsculas
        user = {k.lower(): v for k, v in result[0].items()}

        # 3. Extraer el hash y verificar la contraseña PRIMERO
        hash_guardado = user.get('contrasenahash')
        
        if not hash_guardado:
            return jsonify({'error': 'Error de configuración de credenciales'}), 500

        if not check_password_hash(hash_guardado, password_plana):
            return jsonify({'error': 'Usuario o contraseña incorrectos'}), 401

        # 4. Validar estrictamente el estado de la cuenta
        estado_usuario = str(user.get('estado', 'activo')).strip().lower()
        
        if estado_usuario == 'inactivo':
            return jsonify({'error': 'Tu cuenta ha sido desactivada. Contacte a un administrador.'}), 403

        # --- REGISTRAMOS LA CONEXIÓN EXITOSA ---
        # Obtenemos la IP real (incluso si está detrás de un proxy)
        xff_header = request.headers.get("X-Forwarded-For")
        if xff_header:
            # Dividimos por la coma y nos quedamos con el primer elemento [0] limpiando espacios (.strip())
            ip_usuario = xff_header.split(',')[0].strip()
        else:
            ip_usuario = request.remote_addr
            
        dispositivo = request.headers.get('User-Agent')

        try:
            db.execute_update(
                "INSERT INTO historial_conexiones (id_usuario, fecha_hora, direccion_ip, dispositivo) VALUES (%s, (NOW() - INTERVAL '5 hours'), %s, %s)",
                (user.get('id'), ip_usuario, dispositivo)
            )
        except Exception as e:
            logger.error(f"No se pudo registrar la conexión en el historial: {e}")

        # 5. Si todo está correcto, generar el Token de acceso
        usuario_payload = {
            'id': user.get('id'),
            'usuario': user.get('nombreusuario'),
            'nombre': user.get('nombrecompleto'),
            'cargo': user.get('cargo'),
            'nivelAcceso': user.get('nivelacceso'),
        }
        
        usuario_payload = {
            'id': user.get('id'),
            'usuario': user.get('nombreusuario'),
            'nombre': user.get('nombrecompleto'),
            'cargo': user.get('cargo'),
            'nivelAcceso': user.get('nivelacceso'),
        }
        
        # --- OBTENER PANTALLA DE INICIO ---
        pantalla_inicio = 'dashboard' # Valor por defecto
        try:
            config_query = "SELECT pantalla_inicio FROM configuracion_usuarios WHERE id_usuario = %s"
            config_res = db.execute_query(config_query, (user.get('id'),))
            
            # Verificamos si hay resultados y usamos .get() de forma defensiva
            if config_res and len(config_res) > 0:
                row = config_res[0]
                # Probamos ambos formatos (minúsculas y mayúsculas) para evitar errores
                valor = row.get('pantalla_inicio') or row.get('PANTALLA_INICIO')
                if valor:
                    pantalla_inicio = valor
        except Exception as e:
            logger.error(f"Error obteniendo pantalla de inicio: {e}")
        # -----------------------------------------

        return jsonify({
            'success': True,
            'token': generar_token(usuario_payload),
            'usuario': usuario_payload,
            'pantallaInicio': pantalla_inicio
        }), 200

    except Exception as e:

        return jsonify({
            'success': True,
            'token': generar_token(usuario_payload),
            'usuario': usuario_payload,
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
            "SELECT 1 FROM Usuarios WHERE NombreUsuario = %s",
            (nombre_usuario_frontend,)
        )
        if result_check:
            return jsonify({'error': 'El nombre de usuario ya está en uso'}), 400

        # Verificar DNI
        result_check = db.execute_query(
            "SELECT 1 FROM Usuarios WHERE DNI = %s",
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
            "UPDATE Usuarios SET TokenRecuperacion = ?, TokenExpira = NOW() + INTERVAL '1 hour' WHERE Id = %s",
            (token, usuario_id)
        )

        # Enviar el enlace de recuperación por correo.   
        enlace = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={token}"
        try:
            enviar_correo(
                correo,
                "Recuperación de contraseña - SGC",
                f"Hola {nombre_usuario}, usa este enlace para restablecer tu "
                f"contraseña (válido 1 hora): {enlace}"
            )
        except Exception:   
            logger.exception("No se pudo enviar el correo de recuperación")

        return jsonify({
            "success": True,
            "message": "Si el correo existe, se ha enviado un enlace de recuperación"
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
                AND TokenExpira > NOW() \
                """
        result = db.execute_query(query, (token,))

        if not result:
            return jsonify({"error": "Token inválido o expirado"}), 400

        usuario_id = result[0]["Id"]

        db.execute_update(
            """
            UPDATE Usuarios
            SET ContrasenaHash    = %s,
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
    remitente = os.getenv("SMTP_USER")
    clave = os.getenv("SMTP_PASSWORD")
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    puerto = int(os.getenv("SMTP_PORT", "465"))

    if not remitente or not clave:
        raise RuntimeError("SMTP no configurado (SMTP_USER / SMTP_PASSWORD)")

    msg = MIMEText(mensaje)
    msg["Subject"] = subject
    msg["From"] = remitente
    msg["To"] = to
    with smtplib.SMTP_SSL(host, puerto) as server:
        server.login(remitente, clave)
        server.send_message(msg)

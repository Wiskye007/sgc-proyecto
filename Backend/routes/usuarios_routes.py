from flask import Blueprint, request, jsonify, g
from db_connection import db
import logging
from werkzeug.security import generate_password_hash, check_password_hash
from auth_utils import requiere_auth
from functools import wraps
from datetime import datetime

bp = Blueprint('usuarios', __name__, url_prefix='/api/usuarios')
logger = logging.getLogger(__name__)


# -------------------------------------------------------
# VERIFICACIÓN DE ROLES
# -------------------------------------------------------
def requiere_admin(f):
    """Decorador para verificar que el usuario sea administrador"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        # g.get('usuario') trae el payload del token JWT desencriptado
        payload = g.get('usuario', {})
        
        # BUSCAMOS TODAS LAS VARIANTES POSIBLES EN EL TOKEN (incluyendo 'nivelAcceso')
        rol = payload.get('nivelAcceso') or payload.get('nivelacceso') or payload.get('Nivelacceso') or payload.get('rol') or ''
        
        if rol.lower() not in ['administrador', 'admin']:
            return jsonify({'error': 'Acceso denegado: se requiere rol de administrador'}), 403
        
        return f(*args, **kwargs)
    return wrapper


# -------------------------------------------------------
# ENDPOINT: OBTENER PERFIL DEL USUARIO AUTENTICADO
# -------------------------------------------------------
@bp.route('/perfil', methods=['GET'])
@requiere_auth
def obtener_perfil():
    """Obtener datos del perfil del usuario autenticado"""
    try:
        usuario_id = g.usuario.get('id')
        query = """
            SELECT id, nombrecompleto, dni, cargo, nivelacceso, 
                nombreusuario, fechacreacion, correo 
            FROM usuarios 
            WHERE id = %s
        """
        result = db.execute_query(query, (usuario_id,))
        
        if not result:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        usuario = result[0]
        
        return jsonify({
            'success': True,
            'perfil': {
                'id': usuario.get('Id') or usuario.get('id') or usuario_id,
                'nombreUsuario': usuario.get('Nombreusuario') or usuario.get('nombreusuario') or '',
                'nombreCompleto': usuario.get('Nombrecompleto') or usuario.get('nombrecompleto') or '',
                'dni': usuario.get('Dni') or usuario.get('dni') or 'No registrado',
                'correo': usuario.get('Correo') or usuario.get('correo') or '',
                'cargo': usuario.get('Cargo') or usuario.get('cargo') or 'Usuario',
                'nivelAcceso': usuario.get('Nivelacceso') or usuario.get('nivelacceso') or 'Estándar',
                # Como no tienes columna 'estado', forzamos 'activo' para que el frontend no falle
                'estado': 'activo', 
                'fechaCreacion': str(usuario.get('Fechacreacion') or usuario.get('fechacreacion') or ''),
                # Como no tienes 'fecha_actualizacion', enviamos la fecha de hoy
                'fechaActualizacion': str(datetime.now().strftime('%Y-%m-%d'))
            }
        }), 200
    
    except Exception as e:
        logger.exception(f"Error al obtener perfil: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


# -------------------------------------------------------
# ENDPOINT: ACTUALIZAR PERFIL DEL USUARIO
# -------------------------------------------------------
@bp.route('/perfil', methods=['PUT'])
@requiere_auth
def actualizar_perfil():
    """Actualizar datos del perfil del usuario autenticado"""
    try:
        usuario_id = g.usuario.get('id')
        data = request.get_json()
        
        nombre_completo = data.get('nombreCompleto', '').strip()
        correo = data.get('correo', '').strip()
        cargo = data.get('cargo', '').strip()
        
        if nombre_completo and len(nombre_completo) < 3:
            return jsonify({'error': 'El nombre debe tener al menos 3 caracteres'}), 400
        query = """
            UPDATE usuarios
            SET nombrecompleto = %s, correo = %s, cargo = %s
            WHERE id = %s
        """
        db.execute_update(query, (nombre_completo, correo, cargo, usuario_id))
        return jsonify({
            'success': True,
            'mensaje': 'Perfil actualizado correctamente'
        }), 200
    
    except Exception as e:
        logger.exception(f"Error al actualizar perfil: {e}")
        return jsonify({'error': 'Error al actualizar perfil'}), 500


# -------------------------------------------------------
# ENDPOINT: CAMBIAR CONTRASEÑA
# -------------------------------------------------------
@bp.route('/cambiar-contrasena', methods=['POST'])
@requiere_auth
def cambiar_contrasena():
    """Cambiar la contraseña del usuario autenticado"""
    try:
        usuario_id = g.usuario.get('id')
        data = request.get_json()
        
        contrasena_actual = data.get('contrasenaActual', '').strip()
        contrasena_nueva = data.get('contrasenaNueva', '').strip()
        
        if len(contrasena_nueva) < 6:
            return jsonify({'error': 'La nueva contraseña debe tener al menos 6 caracteres'}), 400
        # Obtener contraseña actual (columna contrasenahash)
        query = "SELECT contrasenahash FROM usuarios WHERE id = %s"
        result = db.execute_query(query, (usuario_id,))
        
        if not result:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        hash_actual = result[0].get('Contrasenahash') or result[0].get('contrasenahash')
        
        if not check_password_hash(hash_actual, contrasena_actual):
            return jsonify({'error': 'Contraseña actual incorrecta'}), 401
        
        hash_nuevo = generate_password_hash(contrasena_nueva)
        
        # Actualizar en la BD
        update_query = "UPDATE usuarios SET contrasenahash = %s WHERE id = %s"
        db.execute_update(update_query, (hash_nuevo, usuario_id))
        
        return jsonify({
            'success': True,
            'mensaje': 'Contraseña actualizada correctamente'
        }), 200
    
    except Exception as e:
        logger.exception(f"Error al cambiar contraseña: {e}")
        return jsonify({'error': 'Error al cambiar contraseña'}), 500


# -------------------------------------------------------
# ENDPOINT: OBTENER CONFIGURACIÓN DEL USUARIO
# -------------------------------------------------------
@bp.route('/configuracion', methods=['GET'])
@requiere_auth
def obtener_configuracion():
    try:
        usuario_id = g.usuario.get('id')
        nivelAcceso = g.usuario.get('rol') or g.usuario.get('nivelacceso') or g.usuario.get('Nivelacceso') or ''
        es_admin = nivelAcceso.lower() in ['administrador', 'admin']
        
        query = """
            SELECT id, tema, notificaciones_email, notificaciones_sistema, 
                privacidad_perfil, autenticacion_dos_factores,
                cierre_inactividad, densidad_tablas, pantalla_inicio, tamano_fuente
            FROM configuracion_usuarios
            WHERE id_usuario = %s
        """
        result = db.execute_query(query, (usuario_id,))
        
        if not result:
            config_default = {
                'idUsuario': usuario_id, 'tema': 'oscuro', 'notificacionesEmail': True,
                'notificacionesSistema': True, 'privacidadPerfil': 'privado',
                'autenticacionDosFactores': False, 'esAdmin': es_admin,
                'cierreInactividad': '30', 'densidadTablas': 'normal',
                'pantallaInicio': 'dashboard', 'tamanoFuente': 'mediano',
                'versionSistema': '1.0.0', 'maintenanceMode': False
            }
            return jsonify({'success': True, 'configuracion': config_default}), 200
        
        config = result[0]
        config_respuesta = {
            'idUsuario': usuario_id,
            'tema': config.get('tema') or 'oscuro',
            'notificacionesEmail': bool(config.get('notificaciones_email')),
            'notificacionesSistema': bool(config.get('notificaciones_sistema')),
            'privacidadPerfil': config.get('privacidad_perfil') or 'privado',
            'autenticacionDosFactores': bool(config.get('autenticacion_dos_factores')),
            'cierreInactividad': config.get('cierre_inactividad') or '30',
            'densidadTablas': config.get('densidad_tablas') or 'normal',
            'pantallaInicio': config.get('pantalla_inicio') or 'dashboard',
            'tamanoFuente': config.get('tamano_fuente') or 'mediano',
            'esAdmin': es_admin,
            'versionSistema': '1.0.0',
            'maintenanceMode': False
        }
        return jsonify({'success': True, 'configuracion': config_respuesta}), 200
    except Exception as e:
        logger.exception(f"Error al obtener configuración: {e}")
        return jsonify({'error': 'Error al obtener configuración'}), 500

# -------------------------------------------------------
# ENDPOINT: ACTUALIZAR CONFIGURACIÓN DEL USUARIO
# -------------------------------------------------------
@bp.route('/configuracion', methods=['PUT'])
@requiere_auth
def actualizar_configuracion():
    try:
        usuario_id = g.usuario.get('id')
        data = request.get_json()
        
        tema = data.get('tema', 'oscuro')
        notif_email = data.get('notificacionesEmail', True)
        notif_sistema = data.get('notificacionesSistema', True)
        privacidad = data.get('privacidadPerfil', 'privado')
        cierre = data.get('cierreInactividad', '30')
        densidad = data.get('densidadTablas', 'normal')
        inicio = data.get('pantallaInicio', 'dashboard')
        fuente = data.get('tamanoFuente', 'mediano')
        
        check_query = "SELECT id FROM configuracion_usuarios WHERE id_usuario = %s"
        check_result = db.execute_query(check_query, (usuario_id,))
        
        if check_result:
            update_query = """
                UPDATE configuracion_usuarios
                SET tema = %s, notificaciones_email = %s, notificaciones_sistema = %s,
                    privacidad_perfil = %s, cierre_inactividad = %s, densidad_tablas = %s,
                    pantalla_inicio = %s, tamano_fuente = %s, fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_usuario = %s
            """
            db.execute_update(update_query, (tema, notif_email, notif_sistema, privacidad, cierre, densidad, inicio, fuente, usuario_id))
        else:
            insert_query = """
                INSERT INTO configuracion_usuarios 
                (id_usuario, tema, notificaciones_email, notificaciones_sistema, privacidad_perfil, cierre_inactividad, densidad_tablas, pantalla_inicio, tamano_fuente)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            db.execute_update(insert_query, (usuario_id, tema, notif_email, notif_sistema, privacidad, cierre, densidad, inicio, fuente))
        
        return jsonify({'success': True, 'mensaje': 'Configuración actualizada'}), 200
    except Exception as e:
        logger.exception(f"Error al actualizar configuración: {e}")
        return jsonify({'error': 'Error al actualizar configuración'}), 500

# -------------------------------------------------------
# ENDPOINT: HISTORIAL DE CONEXIONES (SEGURIDAD)
# -------------------------------------------------------
@bp.route('/historial-conexiones', methods=['GET'])
@requiere_auth
def historial_conexiones():
    try:
        usuario_id = g.usuario.get('id')
        query = """
            SELECT fecha_hora, direccion_ip, dispositivo 
            FROM historial_conexiones 
            WHERE id_usuario = %s 
            ORDER BY fecha_hora DESC 
            LIMIT 5
        """
        result = db.execute_query(query, (usuario_id,))
        
        # Formatear datos
        historial = []
        for r in (result or []):
            historial.append({
                'fecha': r.get('fecha_hora').strftime('%Y-%m-%d %H:%M:%S') if r.get('fecha_hora') else 'Desconocida',
                'ip': r.get('direccion_ip') or 'Desconocida',
                'dispositivo': r.get('dispositivo') or 'Desconocido'
            })
            
        return jsonify({'success': True, 'historial': historial}), 200
    except Exception as e:
        logger.exception(f"Error al obtener historial: {e}")
        return jsonify({'error': 'Error al obtener historial'}), 500


# -------------------------------------------------------
# ENDPOINT: LISTAR USUARIOS (SOLO ADMIN)
# -------------------------------------------------------
@bp.route('', methods=['GET'])
@requiere_auth
@requiere_admin
def listar_usuarios():
    """Listar todos los usuarios del sistema (solo administradores)"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', '').strip()
        cargo_filter = request.args.get('cargo', '').strip()
        nivel_filter = request.args.get('nivel', '').strip()
        estado_filter = request.args.get('estado', '').strip()
        sesion_filter = request.args.get('sesion', '').strip().lower()
        
        if page < 1 or limit < 1 or limit > 100:
            return jsonify({'error': 'Parámetros de paginación inválidos'}), 400
        
        offset = (page - 1) * limit
        where_clauses = []
        params = []
        
        if search:
            where_clauses.append("(LOWER(nombrecompleto) LIKE LOWER(%s) OR LOWER(correo) LIKE LOWER(%s) OR LOWER(dni) LIKE LOWER(%s))")
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])
        
        if cargo_filter:
            where_clauses.append("LOWER(cargo) = LOWER(%s)")
            params.append(cargo_filter)
        
        if nivel_filter:
            where_clauses.append("LOWER(nivelacceso) = LOWER(%s)") # Corregido a nivelacceso
            params.append(nivel_filter)
        
        if estado_filter:
            where_clauses.append("LOWER(estado) = LOWER(%s)")
            params.append(estado_filter)
            
        # --- FILTRADO POR SESIÓN ---
        if sesion_filter == 'online':
            where_clauses.append("ultima_actividad >= CURRENT_TIMESTAMP - INTERVAL '5 minutes'")
        elif sesion_filter == 'offline':
            where_clauses.append("(ultima_actividad < CURRENT_TIMESTAMP - INTERVAL '5 minutes' OR ultima_actividad IS NULL)")
        # -------------------------------------------

        where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        # Contar total de usuarios
        count_query = f"SELECT COUNT(*) as total FROM usuarios {where_sql}"
        count_result = db.execute_query(count_query, params)
        total = count_result[0].get('total') if count_result else 0
        
        # Obtener usuarios
        query = f"""
            SELECT id, nombreusuario, nombrecompleto, dni, correo, cargo, nivelacceso,
                estado, fechacreacion, fecha_actualizacion,
                CASE WHEN ultima_actividad >= CURRENT_TIMESTAMP - INTERVAL '5 minutes' THEN true ELSE false END as en_linea
            FROM usuarios
            {where_sql}
            ORDER BY id DESC
            LIMIT %s OFFSET %s
        """
        params.extend([limit, offset])
        result = db.execute_query(query, params)
        
        usuarios = []
        for user in result:
            usuarios.append({
                'id': user.get('id'),
                'nombreUsuario': user.get('nombreusuario') or '',
                'nombreCompleto': user.get('nombrecompleto') or '',
                'dni': user.get('dni') or '',
                'correo': user.get('correo') or 'Sin correo',
                'cargo': user.get('cargo') or 'Usuario',
                'nivelAcceso': user.get('nivelacceso') or 'Estandar',
                'estado': user.get('estado') or 'activo',
                'enLinea': user.get('en_linea') or False, # <--- Nuevo campo para el Frontend
                'fechaCreacion': str(user.get('fechacreacion') or ''),
                'fechaActualizacion': str(user.get('fecha_actualizacion') or '')
            })
        
        return jsonify({
            'success': True,
            'usuarios': usuarios,
            'paginacion': {'paginaActual': page, 'total': total, 'totalPaginas': (total + limit - 1) // limit, 'porPagina': limit}
        }), 200
    except Exception as e:
        logger.exception(f"Error al listar usuarios: {e}")
        return jsonify({'error': 'Error al listar usuarios'}), 500


# -------------------------------------------------------
# ENDPOINT: OBTENER USUARIO POR ID (SOLO ADMIN)
# -------------------------------------------------------
@bp.route('/<int:usuario_id>', methods=['GET'])
@requiere_auth
@requiere_admin
def obtener_usuario(usuario_id):
    try:
        query = "SELECT * FROM usuarios WHERE id = %s"
        result = db.execute_query(query, (usuario_id,))
        if not result:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        user = result[0]
        return jsonify({
            'success': True,
            'usuario': {
                'id': user.get('id'),
                'nombreUsuario': user.get('nombreusuario'),
                'nombreCompleto': user.get('nombrecompleto'),
                'dni': user.get('dni'),
                'correo': user.get('correo'),
                'cargo': user.get('cargo'),
                'nivelAcceso': user.get('nivelacceso'),
                'estado': user.get('estado') or 'activo'
            }
        }), 200
    except Exception as e:
        return jsonify({'error': 'Error al obtener usuario'}), 500


# -------------------------------------------------------
# ENDPOINT: ACTUALIZAR USUARIO (SOLO ADMIN)
# -------------------------------------------------------
@bp.route('/<int:usuario_id>', methods=['PUT'])
@requiere_auth
@requiere_admin
def actualizar_usuario(usuario_id):
    try:
        data = request.get_json()
        nombre_completo = data.get('nombreCompleto', '').strip()
        correo = data.get('correo', '').strip()
        cargo = data.get('cargo', '').strip()
        nivel_acceso = data.get('nivelAcceso', '').strip()
        estado = data.get('estado', '').strip()
        
        campos = []
        params = []
        
        if nombre_completo: campos.append("nombrecompleto = %s"); params.append(nombre_completo)
        if correo: campos.append("correo = %s"); params.append(correo)
        if cargo: campos.append("cargo = %s"); params.append(cargo)
        if nivel_acceso: campos.append("nivelacceso = %s"); params.append(nivel_acceso)
        if estado: campos.append("estado = %s"); params.append(estado)
        
        if campos:
            campos.append("fecha_actualizacion = CURRENT_TIMESTAMP")
            params.append(usuario_id)
            query = f"UPDATE usuarios SET {', '.join(campos)} WHERE id = %s"
            db.execute_update(query, params)
            return jsonify({'success': True, 'mensaje': 'Usuario actualizado'}), 200
        else:
            return jsonify({'error': 'No hay datos para actualizar'}), 400
    except Exception as e:
        return jsonify({'error': 'Error al actualizar usuario'}), 500


# -------------------------------------------------------
# ENDPOINT: CAMBIAR ESTADO DEL USUARIO (SOLO ADMIN)
# -------------------------------------------------------
@bp.route('/<int:usuario_id>/estado', methods=['PUT'])
@requiere_auth
@requiere_admin
def cambiar_estado_usuario(usuario_id):
    try:
        data = request.get_json()
        estado = data.get('estado', '').strip().lower()
        if estado not in ['activo', 'inactivo']:
            return jsonify({'error': 'Estado no válido'}), 400
        
        query = "UPDATE usuarios SET estado = %s, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = %s"
        db.execute_update(query, (estado, usuario_id))
        return jsonify({'success': True, 'mensaje': f'Usuario {estado}'}), 200
    except Exception as e:
        return jsonify({'error': 'Error al cambiar estado'}), 500


# -------------------------------------------------------
# ENDPOINT: RESETEAR CONTRASEÑA (SOLO ADMIN)
# -------------------------------------------------------
@bp.route('/<int:usuario_id>/reset-password', methods=['POST'])
@requiere_auth
@requiere_admin
def reset_password(usuario_id):
    try:
        contrasena_temporal = f"Temporal#{usuario_id}2026"
        hash_nuevo = generate_password_hash(contrasena_temporal)
        
        query = "UPDATE usuarios SET contrasenahash = %s, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = %s"
        db.execute_update(query, (hash_nuevo, usuario_id))
        
        return jsonify({'success': True, 'mensaje': 'Reseteada', 'contrasenaTemp': contrasena_temporal}), 200
    except Exception as e:
        return jsonify({'error': 'Error al resetear'}), 500

# -------------------------------------------------------
# ENDPOINT: PING DE ACTIVIDAD (ONLINE/OFFLINE)
# -------------------------------------------------------
@bp.route('/ping', methods=['POST'])
@requiere_auth
def ping_usuario():
    """Actualiza la última actividad del usuario para marcarlo 'En línea'"""
    try:
        usuario_id = g.usuario.get('id')
        db.execute_update("UPDATE usuarios SET ultima_actividad = CURRENT_TIMESTAMP WHERE id = %s", (usuario_id,))
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

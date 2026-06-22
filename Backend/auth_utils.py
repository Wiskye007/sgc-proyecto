"""Utilidades de autenticación basadas en tokens firmados (itsdangerous).

El login emite un token firmado con SECRET_KEY que el frontend guarda y envía
en la cabecera `Authorization: Bearer <token>`. El decorador `requiere_auth`
(o el guard global de `app.py`) valida ese token en los endpoints protegidos.
"""
import os
import logging
from functools import wraps

from flask import request, jsonify, g
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

logger = logging.getLogger(__name__)

# 8 horas de validez por defecto.
TOKEN_MAX_AGE = int(os.getenv("TOKEN_MAX_AGE", str(8 * 60 * 60)))
_SALT = "sgc-session"


def _serializer():
    secret = os.getenv("SECRET_KEY")
    if not secret:
        raise RuntimeError("SECRET_KEY no está configurada en el entorno")
    return URLSafeTimedSerializer(secret, salt=_SALT)


def generar_token(usuario):
    """Crear un token de sesión firmado a partir de los datos del usuario."""
    payload = {
        "id": usuario.get("id"),
        "usuario": usuario.get("usuario"),
        "nivelAcceso": usuario.get("nivelAcceso"),
    }
    return _serializer().dumps(payload)


def verificar_token(token):
    """Devolver el payload si el token es válido y no ha expirado, si no None."""
    if not token:
        return None
    try:
        return _serializer().loads(token, max_age=TOKEN_MAX_AGE)
    except SignatureExpired:
        logger.info("Token expirado")
    except BadSignature:
        logger.info("Token inválido")
    return None


def _token_de_cabecera():
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[len("Bearer "):].strip()
    return None


def requiere_auth(f):
    """Decorador para proteger endpoints individuales."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        if request.method == "OPTIONS":
            return f(*args, **kwargs)
        payload = verificar_token(_token_de_cabecera())
        if not payload:
            return jsonify({"error": "No autenticado"}), 401
        g.usuario = payload
        return f(*args, **kwargs)

    return wrapper

# En tu auth_utils.py
def requiere_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # ... (código que decodifica el JWT) ...
        usuario_id = payload.get('id')
        
        # Verificar estado real en BD en cada petición importante
        user_db = db.execute_query("SELECT estado FROM usuarios WHERE id = %s", (usuario_id,))
        if not user_db or user_db[0].get('estado') != 'activo':
            return jsonify({'error': 'Cuenta desactivada'}), 401
            
        return f(*args, **kwargs)
    return decorated
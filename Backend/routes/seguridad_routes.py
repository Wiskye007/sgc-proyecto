from flask import Blueprint, request, jsonify
from db_connection import db
import logging

bp = Blueprint('seguridad', __name__, url_prefix='/api/seguridad')
logger = logging.getLogger(__name__)


@bp.route('/incidentes', methods=['GET'])
def get_incidentes():
    """Obtener lista de incidentes de seguridad"""
    try:
        query = """
                SELECT i.id,
                    i.convicto_id,
                    i.fecha,
                    i.tipo_incidente,
                    i.descripcion,
                    co.nombre,
                    co.apellido
                FROM Incidentes i
                        JOIN Convictos co ON i.convicto_id = co.id
                ORDER BY i.fecha DESC \
                """
        result = db.execute_query(query)
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        logger.error(f"Error obteniendo incidentes: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


@bp.route('/incidentes', methods=['POST'])
def create_incidente():
    """Crear nuevo incidente"""
    try:
        data = request.get_json()

        query = """
                INSERT INTO Incidentes (convicto_id, fecha, tipo_incidente, descripcion)
                VALUES (?, ?, ?, ?) \
                """

        params = (
            data.get('convicto_id'),
            data.get('fecha'),
            data.get('tipo_incidente'),
            data.get('descripcion')
        )

        result = db.execute_update(query, params)
        return jsonify({'success': True, 'message': 'Incidente registrado'}), 201
    except Exception as e:
        logger.error(f"Error creando incidente: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

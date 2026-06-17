from flask import Blueprint, request, jsonify
from db_connection import db
import logging
from datetime import datetime

bp = Blueprint('seguridad', __name__, url_prefix='/api/seguridad')
logger = logging.getLogger(__name__)


@bp.route('/incidentes', methods=['GET'])
def get_incidentes():
    """Obtener lista de incidentes de seguridad."""
    try:
        query = """
                SELECT i.id,
                    i.convicto_id,
                    i.fecha,
                    i.tipo_incidente,
                    i.descripcion
                FROM incidentes i
                ORDER BY i.fecha DESC \
                """
        result = db.execute_query(query)

        incidentes = []
        for r in (result or []):
            fecha = r.get('fecha')
            fecha_str = fecha.strftime('%d/%m/%Y') if hasattr(fecha, 'strftime') else str(fecha or '')
            incidentes.append({
                'id':            r.get('id'),
                'convictoId':    r.get('convicto_id'),
                'fecha':         fecha_str,
                'tipoIncidente': r.get('tipo_incidente'),
                'descripcion':   r.get('descripcion'),
            })

        return jsonify({'success': True, 'data': incidentes}), 200
    except Exception as e:
        logger.error(f"Error obteniendo incidentes: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


@bp.route('/incidentes', methods=['POST'])
def create_incidente():
    """Crear nuevo incidente de seguridad."""
    try:
        data = request.get_json()

        # Campos requeridos
        if not data.get('tipoIncidente') or not data.get('descripcion'):
            return jsonify({'error': 'Tipo de incidente y descripción son obligatorios'}), 400

        fecha_input = data.get('fecha')
        if fecha_input:
            fecha_final = fecha_input.split('T')[0]
        else:
            fecha_final = datetime.now().strftime('%Y-%m-%d')

        query = """
                INSERT INTO incidentes (convicto_id, fecha, tipo_incidente, descripcion)
                VALUES (%s, %s, %s, %s) \
                """ 
        params = (
            data.get('convictoId') or None,
            fecha_final,
            data.get('tipoIncidente'),
            data.get('descripcion'),
        )

        db.execute_update(query, params)
        return jsonify({'success': True, 'message': 'Incidente registrado'}), 201
    except Exception as e:
        logger.error(f"Error creando incidente: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


@bp.route('/incidentes/<int:id>', methods=['PUT'])
def update_incidente(id):
    """Actualizar un incidente existente."""
    try:
        data = request.get_json()

        fecha_input = data.get('fecha')
        fecha_final = fecha_input.split('T')[0] if fecha_input else None

        query = """
                UPDATE incidentes
                SET convicto_id    = %s,
                    fecha          = %s,
                    tipo_incidente = %s,
                    descripcion    = %s
                WHERE id = %s \
                """
        params = (
            data.get('convictoId') or None,
            fecha_final,
            data.get('tipoIncidente'),
            data.get('descripcion'),
            id,
        )

        db.execute_update(query, params)
        return jsonify({'success': True, 'message': 'Incidente actualizado'}), 200
    except Exception as e:
        logger.error(f"Error actualizando incidente: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


@bp.route('/incidentes/<int:id>', methods=['DELETE'])
def delete_incidente(id):
    """Eliminar un incidente."""
    try:
        db.execute_update('DELETE FROM incidentes WHERE id = %s', (id,))
        return jsonify({'success': True, 'message': 'Incidente eliminado'}), 200
    except Exception as e:
        logger.error(f"Error eliminando incidente: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500
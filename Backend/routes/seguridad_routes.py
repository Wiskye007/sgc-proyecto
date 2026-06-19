from flask import Blueprint, request, jsonify
from db_connection import db
import logging
from datetime import datetime, timedelta

bp = Blueprint('seguridad', __name__, url_prefix='/api/seguridad')
logger = logging.getLogger(__name__)


@bp.route('/incidentes', methods=['GET'])
def get_incidentes():
    """Obtener lista de incidentes de seguridad con filtro de tiempo a prueba de fallos"""
    try:
        filtro = request.args.get('filtro', '24h')
        
        where_clause = ""
        hoy = datetime.now()
        
        # Calculamos la fecha límite en Python para evitar conflictos de tipos en PostgreSQL
        if filtro == '24h':
            limite = (hoy - timedelta(days=1)).strftime('%Y-%m-%d')
            where_clause = f"WHERE c.fecha >= '{limite}'"
        elif filtro == 'mes':
            limite = (hoy - timedelta(days=30)).strftime('%Y-%m-%d')
            where_clause = f"WHERE c.fecha >= '{limite}'"
        elif filtro == 'anio':
            limite = (hoy - timedelta(days=365)).strftime('%Y-%m-%d')
            where_clause = f"WHERE c.fecha >= '{limite}'"

        query = f"""
                SELECT c.idconducta as id, 
                       c.idconv as convicto_id, 
                       c.fecha, 
                       c.tipo as tipo_incidente, 
                       c.descripcion,
                       int.nombrecompleto as interno_nombre
                FROM tblconducta c
                LEFT JOIN tblconvictos int ON int.idconv = c.idconv
                {where_clause}
                ORDER BY c.fecha DESC
                """
        result = db.execute_query(query)

        incidentes = []
        for r in (result or []):
            try:
                fecha = r.get('fecha') or r.get('Fecha')
                fecha_str = fecha.strftime('%d/%m/%Y') if hasattr(fecha, 'strftime') else str(fecha or '')

                tipo = str(r.get('tipo_incidente') or '').strip()
                prioridad = "baja"
                
                if tipo.lower() == "falta grave":
                    prioridad = "alta"
                elif tipo.lower() == "falta leve":
                    prioridad = "media"

                incidentes.append({
                    'id': r.get('id') or r.get('Id'),
                    'convicto_id': r.get('convicto_id') or r.get('Convicto_id'),
                    'fecha': fecha_str,
                    'tipo': tipo,
                    'prioridad': prioridad,
                    'descripcion': r.get('descripcion') or r.get('Descripcion'),
                    'interno_nombre': r.get('interno_nombre') or 'Desconocido'
                })
            except Exception as row_error:
                continue

        return jsonify({'success': True, 'data': incidentes}), 200
    except Exception as e:
        logger.error(f"Error obteniendo incidentes: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': str(e), 'data': []}), 500


@bp.route('/incidentes', methods=['POST'])
def create_incidente():
    """Crear nuevo incidente en tblconducta"""
    try:
        data = request.get_json()   
        fecha_input = data.get('fecha')
        fecha_final = fecha_input.split('T')[0] if fecha_input else datetime.now().strftime('%Y-%m-%d')

        # Usamos tu tabla real: tblconducta
        query = """
                INSERT INTO tblconducta (idconv, fecha, tipo, descripcion)
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

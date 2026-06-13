from flask import Blueprint, request, jsonify
from db_connection import db
import logging

bp = Blueprint('convictos', __name__, url_prefix='/api/convictos')
logger = logging.getLogger(__name__)


# ======================= CONVICTOS CRUD =======================

@bp.route('', methods=['GET'])
def obtener_convictos():
    try:
        query = """
                SELECT IDConv,
                    NombreCompleto,
                    Alias,
                    DNI,
                    Edad,
                    Delito,
                    Pabellon,
                    Celda,
                    Estado,
                    Nivel,
                    Contacto,
                    Observaciones,
                    FechaIngreso
                FROM tblConvictos \
                """
        resultados = db.execute_query(query)

        convictos = []
        if resultados:
            for r in resultados:
                from datetime import datetime
                fechaingreso = r["fecha_ingreso"]
                if isinstance(fechaingreso, datetime):
                    fecha_str = fechaingreso.strftime("%d/%m/%Y %H:%M:%S")
                else:
                    fecha_str = str(fechaingreso)

                convictos.append({
                    'id': r['IDConv'],
                    'nombre': r['NombreCompleto'],
                    'alias': r['Alias'],
                    'dni': r['DNI'],
                    'edad': r['Edad'],
                    'delito': r['Delito'],
                    'pabellon': r['Pabellon'],
                    'celda': r['Celda'],
                    'estado': r['Estado'],
                    'nivelPeligrosidad': r['Nivel'],
                    'contacto': r['Contacto'],
                    'observaciones': r['Observaciones'],
                    'fechaingreso': fecha_str
                })

        return jsonify(convictos), 200
    except Exception as e:
        logger.error(f"Error obteniendo convictos: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('', methods=['POST'])
def crear_convicto():
    try:
        data = request.get_json()
        dni = data.get('dni')

        # --- VALIDACIÓN DE DNI DUPLICADO ---
        if dni:
            check_query = "SELECT 1 FROM tblConvictos WHERE DNI = ?"
            existe = db.execute_query(check_query, (dni,))
            if existe:
                return jsonify({'error': f'El DNI "{dni}" ya se encuentra registrado en el sistema.'}), 409
        fecha_input = data.get('fechaingreso')
        
        if fecha_input:
            from datetime import datetime
            try:
                fecha_limpia = fecha_input.replace('T', ' ').split('.')[0]
                fecha_actual = fecha_limpia
            except:
                fecha_actual = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        else:
            from datetime import datetime
            fecha_actual = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        query = """
                INSERT INTO tblConvictos (NombreCompleto, Alias, DNI, Edad, Delito, Pabellon, Celda, Estado, Nivel,
                Contacto, Observaciones, FechaIngreso)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) \
                """
        params = (
            data.get('nombre'), data.get('alias'), dni,
            data.get('edad'), data.get('delito'), data.get('pabellon'),
            data.get('celda'), data.get('estado'), data.get('nivelPeligrosidad'),
            data.get('contacto'), data.get('observaciones'), fecha_actual
        )

        db.execute_update(query, params)
        return jsonify({'success': True, 'message': 'Convicto registrado correctamente'}), 201
    except Exception as e:
        logger.error(f"Error creando convicto: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id>', methods=['PUT'])
def actualizar_convicto(id):
    try:
        data = request.get_json()
        dni = data.get('dni')

        # --- VALIDACIÓN DE DNI ---
        if dni:
            check_query = "SELECT 1 FROM tblConvictos WHERE DNI = ? AND IDConv != ?"
            existe = db.execute_query(check_query, (dni, id))
            if existe:
                return jsonify({'error': f'El DNI {dni} ya pertenece a otro convicto.'}), 409

        query = """
                UPDATE tblConvictos
                SET NombreCompleto=?,
                    Alias=?,
                    DNI=?,
                    Edad=?,
                    Delito=?,
                    Pabellon=?,
                    Celda=?,
                    Estado=?,
                    Nivel=?,
                    Contacto=?,
                    Observaciones=?
                WHERE IDConv = ? \
                """
        params = (
            data.get('nombre'), data.get('alias'), dni,
            data.get('edad'), data.get('delito'), data.get('pabellon'),
            data.get('celda'), data.get('estado'), data.get('nivelPeligrosidad'),
            data.get('contacto'), data.get('observaciones'),
            id
        )
        db.execute_update(query, params)
        return jsonify({'success': True, 'message': 'Convicto actualizado'}), 200
    except Exception as e:
        logger.error(f"Error actualizando convicto: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id>', methods=['DELETE'])
def eliminar_convicto(id):
    try:
        # Primero borramos registros relacionados para mantener integridad referencial
        db.execute_update("DELETE FROM tblMovimientos WHERE IDConv = ?", (id,))
        db.execute_update("DELETE FROM tblConducta WHERE IDConv = ?", (id,))
        db.execute_update("DELETE FROM tblVisitas WHERE IDConv = ?", (id,))

        # Luego borramos al convicto
        query = "DELETE FROM tblConvictos WHERE IDConv = ?"
        db.execute_update(query, (id,))
        return jsonify({'success': True, 'message': 'Registro de convicto eliminado'}), 200
    except Exception as e:
        logger.error(f"Error eliminando convicto: {e}")
        return jsonify({'error': str(e)}), 500


# ======================= MOVIMIENTOS =======================

@bp.route('/movimientos', methods=['GET'])
def obtener_movimientos():
    try:
        query = """
                SELECT m.IDMov,
                    m.Fecha,
                    m.Hora,
                    m.IDConv,
                    c.NombreCompleto AS NombreCompleto,
                    m.Origen,
                    m.Destino,
                    m.Motivo,
                    m.AutorizadoPor
                FROM tblMovimientos m
                        LEFT JOIN tblConvictos c ON m.IDConv = c.IDConv
                ORDER BY m.Fecha DESC \
                """
        resultados = db.execute_query(query)

        movimientos = []
        if resultados:
            for r in resultados:
                # --- FECHA ---
                from datetime import date
                fecha = r["fecha"]
                if isinstance(fecha, date):
                    fecha_str = fecha.strftime("%d/%m/%Y")
                else:
                    fecha_str = str(fecha)

                # --- HORA ---
                hora = r["Hora"]
                if hasattr(hora, "strftime"):
                    hora_str = hora.strftime("%H:%M")
                else:
                    hora_str = "00:00" if hora in (None, "", "None") else str(hora)

                movimientos.append({
                    'id': r['IDMov'],
                    'fecha': fecha_str,
                    'hora': hora_str,
                    'convictoId': r['IDConv'],
                    'nombre': r['NombreCompleto'],
                    'origen': r['Origen'],
                    'destino': r['Destino'],
                    'motivo': r['Motivo'],
                    'autorizadoPor': r['AutorizadoPor']
                })

        return jsonify(movimientos), 200

    except Exception as e:
        logger.error(f"Error movimientos: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/movimientos', methods=['POST'])
def crear_movimiento():
    try:
        data = request.get_json()

        if not data.get('convicto') or not data.get('origen') or not data.get('destino'):
            return jsonify({'error': 'Faltan datos obligatorios'}), 400

        from datetime import datetime
        fecha_input = data.get('fecha')
        
        if fecha_input:
            fecha_final = fecha_input.split('T')[0]
        else:
            fecha_final = datetime.now().strftime("%Y-%m-%d")
            
        hora_final = data.get('hora') or datetime.now().strftime("%H:%M:%S")

        query = """
                INSERT INTO tblMovimientos (Fecha, Hora, IDConv, Origen, Destino, Motivo, AutorizadoPor)
                VALUES (?, ?, ?, ?, ?, ?, ?) \
                """

        params = (
            fecha_final,
            hora_final,
            data.get('convicto'),
            data.get('origen'),
            data.get('destino'),
            data.get('motivo'),
            data.get('autorizadoPor') or 'Sistema'
        )

        db.execute_update(query, params)
        return jsonify({'success': True, 'message': 'Movimiento registrado'}), 201

    except Exception as e:
        logger.error(f"Error creando movimiento: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/movimientos/<int:id>', methods=['PUT'])
def actualizar_movimiento(id):
    try:
        data = request.get_json()
        
        fecha_input = data.get('fecha')
        fecha_final = fecha_input.split('T')[0] if fecha_input else None

        query = """
                UPDATE tblMovimientos
                SET Fecha=?,
                    Hora=?,
                    IDConv=?,
                    Origen=?,
                    Destino=?,
                    Motivo=?,
                    AutorizadoPor=?
                WHERE IDMov = ? \
                """
        params = (
            fecha_final,
            data.get('hora'),
            data.get('convictoId'),
            data.get('origen'),
            data.get('destino'),
            data.get('motivo'),
            data.get('autorizadoPor'),
            id
        )

        db.execute_update(query, params)
        return jsonify({'success': True, 'message': 'Movimiento actualizado'}), 200

    except Exception as e:
        logger.error(f"Error actualizando movimiento: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/movimientos/<int:id>', methods=['DELETE'])
def eliminar_movimiento(id):
    try:
        db.execute_update("DELETE FROM tblMovimientos WHERE IDMov = ?", (id,))
        return jsonify({'success': True, 'message': 'Movimiento eliminado'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ======================= CONDUCTA =======================

@bp.route('/conducta', methods=['GET'])
def obtener_conductas():
    try:
        query = """
                SELECT c.IDConducta,
                    c.Fecha,
                    c.IDConv,
                    tc.NombreCompleto AS NombreCompleto,
                    c.Tipo,
                    c.Descripcion,
                    c.Sancion,
                    c.RegistradoPor
                FROM tblConducta c
                        LEFT JOIN tblConvictos tc ON c.IDConv = tc.IDConv
                ORDER BY c.Fecha DESC \
                """
        resultados = db.execute_query(query)
        conductas = []
        if resultados:
            for r in resultados:

                fecha = r["fecha"]
                if hasattr(fecha, "strftime"):
                    fecha_str = fecha.strftime("%d/%m/%Y")
                else:
                    fecha_str = str(fecha)

                conductas.append({
                    'id': r['IDConducta'],
                    'fecha': fecha_str,
                    'convictoId': r['IDConv'],
                    'nombre': r['NombreCompleto'],
                    'tipo': r['Tipo'],
                    'descripcion': r['Descripcion'],
                    'sancion': r['Sancion'],
                    'registrado': r['RegistradoPor']
                })
        return jsonify(conductas), 200
    except Exception as e:
        logger.error(f"Error obteniendo conductas: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/conducta', methods=['POST'])
def crear_conducta():
    try:
        data = request.get_json()

        # -------- VALIDACIONES --------
        if not data.get('convictoId') or not data.get('tipo') or not data.get('descripcion'):
            return jsonify({'error': 'Faltan datos obligatorios.'}), 400

        descripcion = data.get('descripcion')
        if len(descripcion.strip()) < 10:
            return jsonify({'error': 'La descripción debe tener al menos 10 caracteres.'}), 400

        # 🔥 CORRECCIÓN: Evitamos date.fromisoformat que explota con la 'T' de React
        fecha_input = data.get('fecha')
        if fecha_input:
            fecha_final = fecha_input.split('T')[0]
        else:
            from datetime import datetime
            fecha_final = datetime.now().strftime("%Y-%m-%d")

        # -------- INSERTAR --------
        query = """
                INSERT INTO tblConducta (IDConv, Fecha, Tipo, Descripcion, Sancion, RegistradoPor)
                VALUES (?, ?, ?, ?, ?, ?) \
                """
        params = (
            data.get('convictoId'),
            fecha_final,
            data.get('tipo'),
            descripcion.strip(),
            data.get('sancion'),
            data.get('registrado') or 'Sistema'
        )

        db.execute_update(query, params)
        return jsonify({'success': True, 'message': 'Conducta registrada correctamente'}), 201

    except Exception as e:
        logger.error(f"Error creando conducta: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/conducta/<int:id>', methods=['PUT'])
def actualizar_conducta(id):
    try:
        data = request.get_json()

        # -------- VALIDACIONES --------
        if not data.get('convictoId') or not data.get('tipo') or not data.get('descripcion'):
            return jsonify({'error': 'Faltan datos obligatorios.'}), 400

        descripcion = data.get('descripcion')
        
        fecha_input = data.get('fecha')
        fecha_final = fecha_input.split('T')[0] if fecha_input else None

        # -------- UPDATE --------
        query = """
                UPDATE tblConducta
                SET IDConv=?,
                    Fecha=?,
                    Tipo=?,
                    Descripcion=?,
                    Sancion=?,
                    RegistradoPor=?
                WHERE IDConducta = ? \
                """

        params = (
            data.get('convictoId'),
            fecha_final,
            data.get('tipo'),
            descripcion.strip(),
            data.get('sancion'),
            data.get('registrado'),
            id
        )

        rows = db.execute_update(query, params)

        if rows == 0:
            return jsonify({'error': 'No existe una conducta con ese ID.'}), 404

        return jsonify({'success': True, 'message': 'Conducta actualizada correctamente'}), 200

    except Exception as e:
        logger.error(f"Error actualizando conducta: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/conducta/<int:id>', methods=['DELETE'])
def eliminar_conducta(id):
    try:
        db.execute_update("DELETE FROM tblConducta WHERE IDConducta = ?", (id,))
        return jsonify({'success': True}), 200
    except Exception as e:
        logger.error(f"Error eliminando conducta: {e}")
        return jsonify({'error': str(e)}), 500


# ======================= VISITAS =======================

@bp.route('/visitas', methods=['GET'])
def obtener_visitas():
    try:
        query = """
                SELECT v.IDVisita,
                    v.Fecha,
                    v.Hora,
                    v.IDConv,
                    tc.NombreCompleto AS NombreCompleto,
                    v.Visitante,
                    v.DNIVisitante,
                    v.Parentesco,
                    v.Estado,
                    v.Observaciones
                FROM tblVisitas v
                        LEFT JOIN tblConvictos tc ON v.IDConv = tc.IDConv
                ORDER BY v.Fecha DESC \
                """
        resultados = db.execute_query(query)
        visitas = []
        if resultados:
            for r in resultados:
                # --- FECHA ---
                fecha = r["fecha"]
                if hasattr(fecha, "strftime"):
                    fecha_str = fecha.strftime("%d/%m/%Y")
                else:
                    fecha_str = str(fecha)

                # --- HORA ---
                hora = r["Hora"]
                if hasattr(hora, "strftime"):
                    hora_str = hora.strftime("%H:%M")
                else:
                    hora_str = "00:00" if hora in (None, "", "None") else str(hora)
                    
                visitas.append({
                    'id': r['IDVisita'],
                    'fecha': fecha_str,
                    'hora': hora_str,
                    'convictoId': r['IDConv'],
                    'nombre': r['NombreCompleto'],
                    'visitante': r['Visitante'],
                    'dniVisitante': r['DNIVisitante'],
                    'parentesco': r['Parentesco'],
                    'estado': r['Estado'],
                    'observaciones': r['Observaciones']
                })
        return jsonify(visitas), 200
    except Exception as e:
        logger.error(f"Error obteniendo visitas: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/visitas', methods=['POST'])
def crear_visita():
    try:
        data = request.get_json()
        fecha_raw = data.get('fecha')
        
        if fecha_raw and 'T' in fecha_raw:
            fecha_final = fecha_raw.split('T')[0]
            hora_final = fecha_raw.split('T')[1][:5]  # Agarra solo HH:MM
        else:
            fecha_final = fecha_raw
            hora_final = data.get('hora') or "00:00"

        query = """
                INSERT INTO tblVisitas (Fecha, Hora, IDConv, Visitante, DNIVisitante, Parentesco, Estado, Observaciones)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?) \
                """
        params = (
            fecha_final, 
            hora_final,
            data.get('recluso') or data.get('convictoId'),  # ID
            data.get('visitante'), 
            data.get('dniVisitante'),
            data.get('parentesco'), 
            data.get('estado') or 'Programada', 
            data.get('observaciones')
        )
        db.execute_update(query, params)
        return jsonify({'success': True}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/visitas/<int:id>', methods=['PUT'])
def actualizar_visita(id):
    try:
        data = request.get_json()

        # -------- VALIDACIONES --------
        campos_obligatorios = ['visitante', 'dniVisitante']
        for campo in campos_obligatorios:
            if not data.get(campo):
                return jsonify({'error': f"El campo '{campo}' es obligatorio."}), 400

        # 🔥 CORRECCIÓN: Separar fecha y hora limpiamente sin date.fromisoformat
        fecha_raw = data.get('fecha')
        if fecha_raw and 'T' in fecha_raw:
            fecha_final = fecha_raw.split('T')[0]
            hora_final = fecha_raw.split('T')[1][:5]
        else:
            fecha_final = fecha_raw
            hora_final = data.get('hora')

        # -------- ACTUALIZACIÓN --------
        query = """
                UPDATE tblVisitas
                SET Fecha=?,
                    Hora=?,
                    IDConv=?,
                    Visitante=?,
                    DNIVisitante=?,
                    Parentesco=?,
                    Estado=?,
                    Observaciones=?
                WHERE IDVisita = ? \
                """

        params = (
            fecha_final,
            hora_final,
            data.get('recluso') or data.get('convictoId'),
            data.get('visitante'),
            data.get('dniVisitante'),
            data.get('parentesco'),
            data.get('estado'),
            data.get('observaciones'),
            id
        )

        rows = db.execute_update(query, params)

        if rows == 0:
            return jsonify({'error': 'La visita con ese ID no existe.'}), 404

        return jsonify({'success': True, 'message': 'Visita actualizada correctamente'}), 200

    except Exception as e:
        logger.error(f"Error actualizando visita: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/visitas/<int:id>', methods=['DELETE'])
def eliminar_visita(id):
    try:
        db.execute_update("DELETE FROM tblVisitas WHERE IDVisita = ?", (id,))
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

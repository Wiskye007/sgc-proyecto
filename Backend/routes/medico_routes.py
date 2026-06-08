from flask import Blueprint, request, jsonify
from db_connection import db
import logging
from datetime import datetime, date

bp = Blueprint("medico", __name__, url_prefix="/api/medico")
logger = logging.getLogger(__name__)


def formatear_fecha(fecha):
    if not fecha:
        return None
    if isinstance(fecha, datetime) or hasattr(fecha, "strftime"):
        return fecha.strftime("%d/%m/%Y")
    return str(fecha)


#  REVISIÓN MÉDICA

@bp.route("/revisiones", methods=["GET"])
def obtener_revisiones():
    try:
        query = """
                SELECT r.IDRevision,
                       r.Fecha,
                       r.Hora,
                       r.Prioridad,
                       r.IDConv,
                       r.Diagnostico,
                       r.Tratamiento,
                       r.MedicoResponsable,
                       r.ProximaRevision,
                       c.NombreCompleto AS NombreCompleto,
                       c.DNI            AS DNI
                FROM tblRevisionesMedicas r
                         LEFT JOIN tblConvictos c ON r.IDConv = c.IDConv
                ORDER BY r.Fecha DESC \
                """
        resultados = db.execute_query(query)

        revisiones = []
        for r in resultados:
            revisiones.append({
                "id": r["IDRevision"],
                "fecha": formatear_fecha(r["Fecha"]),
                "hora": r["Hora"].strftime("%H:%M") if r["Hora"] else None,
                "prioridad": r["Prioridad"],
                "convictoId": r["IDConv"],
                "nombre": r["NombreCompleto"],
                "diagnostico": r["Diagnostico"],
                "tratamiento": r["Tratamiento"],
                "medico": r["MedicoResponsable"],
                "proximaRevision": formatear_fecha(r["ProximaRevision"])
            })

        return jsonify(revisiones), 200
    except Exception as e:
        logger.error(f"Error obteniendo revisiones: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/revisiones", methods=["POST"])
def crear_revision():
    try:
        data = request.get_json()

        if not data.get("convictoId") or not data.get("diagnostico"):
            return jsonify({"error": "Convicto y diagnóstico son obligatorios."}), 400

        query = """
                INSERT INTO tblRevisionesMedicas
                (Fecha, Hora, Prioridad, IDConv, Diagnostico, Tratamiento, MedicoResponsable, ProximaRevision)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?) \
                """
        params = (
            data.get("fecha"),
            data.get("hora"),
            data.get("prioridad"),
            data.get("convictoId"),
            data.get("diagnostico"),
            data.get("tratamiento"),
            data.get("medico"),
            data.get("proximaRevision")
        )

        db.execute_update(query, params)
        return jsonify({"success": True}), 201

    except Exception as e:
        logger.error(f"Error creando revisión: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/revisiones/<int:id>", methods=["PUT"])
def actualizar_revision(id):
    try:
        data = request.get_json()

        query = """
                UPDATE tblRevisionesMedicas
                SET Fecha=?,
                    Hora=?,
                    Prioridad=?,
                    IDConv=?,
                    Diagnostico=?,
                    Tratamiento=?,
                    MedicoResponsable=?,
                    ProximaRevision=?
                WHERE IDRevision = ? \
                """
        params = (
            data.get("fecha"),
            data.get("hora"),
            data.get("prioridad"),
            data.get("convictoId"),
            data.get("diagnostico"),
            data.get("tratamiento"),
            data.get("medico"),
            data.get("proximaRevision"),
            id
        )

        db.execute_update(query, params)
        return jsonify({"success": True}), 200

    except Exception as e:
        logger.error(f"Error actualizando revisión: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/revisiones/<int:id>", methods=["DELETE"])
def eliminar_revision(id):
    try:
        db.execute_update("DELETE FROM tblRevisionesMedicas WHERE IDRevision=?", (id,))
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


#  TRATAMIENTOS

@bp.route("/tratamientos", methods=["GET"])
def obtener_tratamientos():
    try:
        query = """
                SELECT t.IDTratamiento,
                       t.IDConv,
                       t.Medicamento,
                       t.Dosis,
                       t.Frecuencia,
                       t.Duracion,
                       t.Medico,
                       t.FechaInicio,
                       c.NombreCompleto AS NombreCompleto
                FROM tblTratamientos t
                         LEFT JOIN tblConvictos c ON t.IDConv = c.IDConv
                ORDER BY t.IDTratamiento DESC \
                """
        resultados = db.execute_query(query)

        tratamientos = []
        for r in resultados:
            tratamientos.append({
                "id": r["IDTratamiento"],
                "convictoId": r["IDConv"],
                "nombre": r["NombreCompleto"],
                "medicamento": r["Medicamento"],
                "dosis": r["Dosis"],
                "frecuencia": r["Frecuencia"],
                "duracion": r["Duracion"],
                "medico": r["Medico"],
                "fechaInicio": formatear_fecha(r["FechaInicio"])
            })

        return jsonify(tratamientos), 200

    except Exception as e:
        logger.error(f"Error obteniendo tratamientos: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/tratamientos", methods=["POST"])
def crear_tratamiento():
    try:
        data = request.get_json()

        query = """
                INSERT INTO tblTratamientos
                    (IDConv, Medicamento, Dosis, Frecuencia, Duracion, Medico, FechaInicio)
                VALUES (?, ?, ?, ?, ?, ?, ?) \
                """
        params = (
            data.get("convictoId"),
            data.get("medicamento"),
            data.get("dosis"),
            data.get("frecuencia"),
            data.get("duracion"),
            data.get("medico"),
            data.get("fechaInicio")
        )

        db.execute_update(query, params)
        return jsonify({"success": True}), 200

    except Exception as e:
        logger.error(f"Error creando tratamiento: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/tratamientos/<int:id>", methods=["PUT"])
def actualizar_tratamiento(id):
    try:
        data = request.get_json()

        query = """
                UPDATE tblTratamientos
                SET IDConv=?,
                    Medicamento=?,
                    Dosis=?,
                    Frecuencia=?,
                    Duracion=?,
                    Medico=?,
                    FechaInicio=?
                WHERE IDTratamiento = ? \
                """
        params = (
            data.get("convictoId"),
            data.get("medicamento"),
            data.get("dosis"),
            data.get("frecuencia"),
            data.get("duracion"),
            data.get("medico"),
            data.get("fechaInicio"),
            id
        )

        db.execute_update(query, params)
        return jsonify({"success": True}), 200

    except Exception as e:
        logger.error(f"Error actualizando tratamiento: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/tratamientos/<int:id>", methods=["DELETE"])
def eliminar_tratamiento(id):
    try:
        db.execute_update("DELETE FROM tblTratamientos WHERE IDTratamiento=?", (id,))
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


#  DERIVACIONES

@bp.route("/derivaciones", methods=["GET"])
def obtener_derivaciones():
    try:
        query = """
                SELECT d.IDDerivacion,
                       d.Estado,
                       d.IDConv,
                       d.Especialidad,
                       d.Motivo,
                       d.Urgencia,
                       d.Institucion,
                       d.Fecha,
                       c.NombreCompleto AS NombreCompleto
                FROM tblDerivaciones d
                         LEFT JOIN tblConvictos c ON d.IDConv = c.IDConv
                ORDER BY d.IDDerivacion DESC \
                """
        resultados = db.execute_query(query)

        derivaciones = []
        for r in resultados:
            derivaciones.append({
                "id": r["IDDerivacion"],
                "estado": r["Estado"],
                "convictoId": r["IDConv"],
                "nombre": r["NombreCompleto"],
                "especialidad": r["Especialidad"],
                "motivo": r["Motivo"],
                "urgencia": r["Urgencia"],
                "institucion": r["Institucion"],
                "fecha": formatear_fecha(r["Fecha"])
            })

        return jsonify(derivaciones), 200

    except Exception as e:
        logger.error(f"Error obteniendo derivaciones: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/derivaciones", methods=["POST"])
def crear_derivacion():
    try:
        data = request.get_json()

        query = """
                INSERT INTO tblDerivaciones
                    (Estado, IDConv, Especialidad, Motivo, Urgencia, Institucion, Fecha)
                VALUES (?, ?, ?, ?, ?, ?, ?) \
                """
        params = (
            data.get("estado"),
            data.get("convictoId"),
            data.get("especialidad"),
            data.get("motivo"),
            data.get("urgencia"),
            data.get("institucion"),
            data.get("fecha")
        )

        db.execute_update(query, params)
        return jsonify({"success": True}), 200

    except Exception as e:
        logger.error(f"Error creando derivación: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/derivaciones/<int:id>", methods=["PUT"])
def actualizar_derivacion(id):
    try:
        data = request.get_json()

        query = """
                UPDATE tblDerivaciones
                SET Estado=?,
                    IDConv=?,
                    Especialidad=?,
                    Motivo=?,
                    Urgencia=?,
                    Institucion=?,
                    Fecha=?
                WHERE IDDerivacion = ? \
                """
        params = (
            data.get("estado"),
            data.get("convictoId"),
            data.get("especialidad"),
            data.get("motivo"),
            data.get("urgencia"),
            data.get("institucion"),
            data.get("fecha"),
            id
        )

        db.execute_update(query, params)
        return jsonify({"success": True}), 200

    except Exception as e:
        logger.error(f"Error actualizando derivación: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/derivaciones/<int:id>", methods=["DELETE"])
def eliminar_derivacion(id):
    try:
        db.execute_update("DELETE FROM tblDerivaciones WHERE IDDerivacion=?", (id,))
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


#  HISTORIAL MÉDICO

@bp.route("/historial", methods=["GET"])
def obtener_historial():
    try:
        query = """
                SELECT h.IDHistorial,
                       h.Fecha,
                       h.IDConv,
                       h.Tipo,
                       h.Diagnostico,
                       h.Medico,
                       h.Observaciones,
                       c.NombreCompleto AS NombreCompleto
                FROM tblHistorial h
                         LEFT JOIN tblConvictos c ON h.IDConv = c.IDConv
                ORDER BY h.Fecha DESC \
                """

        resultados = db.execute_query(query)

        historial = []
        for r in resultados:
            historial.append({
                "id": r["IDHistorial"],
                "fecha": formatear_fecha(r["Fecha"]),
                "convictoId": r["IDConv"],
                "nombre": r["NombreCompleto"],
                "tipo": r["Tipo"],
                "diagnostico": r["Diagnostico"],
                "medico": r["Medico"],
                "observaciones": r["Observaciones"]
            })

        return jsonify(historial), 200

    except Exception as e:
        logger.error(f"Error obteniendo historial médico: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/historial", methods=["POST"])
def crear_historial():
    try:
        data = request.get_json()

        query = """
                INSERT INTO tblHistorial
                    (Fecha, IDConv, Tipo, Diagnostico, Medico, Observaciones)
                VALUES (?, ?, ?, ?, ?, ?) \
                """
        params = (
            data.get("fecha"),
            data.get("convictoId"),
            data.get("tipo"),
            data.get("diagnostico"),
            data.get("medico"),
            data.get("observaciones")
        )

        db.execute_update(query, params)
        return jsonify({"success": True}), 200

    except Exception as e:
        logger.error(f"Error creando historial médico: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/historial/<int:id>", methods=["PUT"])
def actualizar_historial(id):
    try:

        data = request.get_json()

        query = """
                UPDATE tblHistorial
                SET Fecha=?,
                    IDConv=?,
                    Tipo=?,
                    Diagnostico=?,
                    Medico=?,
                    Observaciones=?
                WHERE IDHistorial = ? \
                """
        params = (
            data.get("fecha"),
            data.get("convictoId"),
            data.get("tipo"),
            data.get("diagnostico"),
            data.get("medico"),
            data.get("observaciones"),
            id
        )

        db.execute_update(query, params)
        return jsonify({"success": True}), 200

    except Exception as e:
        logger.error(f"Error actualizando historial médico: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/historial/<int:id>", methods=["DELETE"])
def eliminar_historial(id):
    try:
        db.execute_update("DELETE FROM tblHistorial WHERE IDHistorial=?", (id,))
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

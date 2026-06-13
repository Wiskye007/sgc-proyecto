"""
Script para inicializar la base de datos PostgreSQL (Supabase) con el esquema
que realmente consultan las rutas de la API.

Ejecutar: python Backend/scripts/init_db.py

Requiere la variable de entorno DATABASE_URL (no se versiona ninguna credencial).
"""
import psycopg2
import os
from dotenv import load_dotenv
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_connection():
    """Crear conexión a PostgreSQL usando DATABASE_URL del entorno."""
    connection_string = os.getenv("DATABASE_URL")
    if not connection_string:
        raise ValueError("DATABASE_URL no está configurada en el entorno/.env")
    return psycopg2.connect(connection_string)


# Cada entrada es (nombre_legible, sentencia CREATE TABLE).
# Los nombres de columnas van en minúsculas porque las rutas usan identificadores
# sin comillas y PostgreSQL los normaliza a minúsculas.
TABLAS = [
    # 1. Usuarios (login / registro / recuperación)
    ("usuarios", """
        CREATE TABLE IF NOT EXISTS usuarios (
            id                SERIAL PRIMARY KEY,
            nombreusuario     VARCHAR(50)  NOT NULL UNIQUE,
            nombrecompleto    VARCHAR(150) NOT NULL,
            dni               VARCHAR(20)  NOT NULL UNIQUE,
            correo            VARCHAR(150) UNIQUE,
            cargo             VARCHAR(100),
            nivelacceso       VARCHAR(50),
            contrasenahash    VARCHAR(255) NOT NULL,
            tokenrecuperacion VARCHAR(255),
            tokenexpira       TIMESTAMP,
            fechacreacion     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """),

    # 2. Convictos (módulo principal)
    ("tblconvictos", """
        CREATE TABLE IF NOT EXISTS tblconvictos (
            idconv         SERIAL PRIMARY KEY,
            nombrecompleto VARCHAR(150) NOT NULL,
            alias          VARCHAR(100),
            dni            VARCHAR(20) UNIQUE,
            edad           INT,
            delito         VARCHAR(255),
            pabellon       VARCHAR(50),
            celda          VARCHAR(50),
            estado         VARCHAR(50),
            nivel          VARCHAR(50),
            contacto       VARCHAR(150),
            observaciones  TEXT,
            fechaingreso   TIMESTAMP
        );
    """),

    # 3. Movimientos
    ("tblmovimientos", """
        CREATE TABLE IF NOT EXISTS tblmovimientos (
            idmov         SERIAL PRIMARY KEY,
            fecha         DATE,
            hora          TIME,
            idconv        INT REFERENCES tblconvictos(idconv) ON DELETE CASCADE,
            origen        VARCHAR(150),
            destino       VARCHAR(150),
            motivo        VARCHAR(255),
            autorizadopor VARCHAR(150)
        );
    """),

    # 4. Conducta
    ("tblconducta", """
        CREATE TABLE IF NOT EXISTS tblconducta (
            idconducta    SERIAL PRIMARY KEY,
            idconv        INT REFERENCES tblconvictos(idconv) ON DELETE CASCADE,
            fecha         DATE,
            tipo          VARCHAR(100),
            descripcion   TEXT,
            sancion       VARCHAR(255),
            registradopor VARCHAR(150)
        );
    """),

    # 5. Visitas
    ("tblvisitas", """
        CREATE TABLE IF NOT EXISTS tblvisitas (
            idvisita      SERIAL PRIMARY KEY,
            fecha         DATE,
            hora          TIME,
            idconv        INT REFERENCES tblconvictos(idconv) ON DELETE CASCADE,
            visitante     VARCHAR(150),
            dnivisitante  VARCHAR(20),
            parentesco    VARCHAR(100),
            estado        VARCHAR(50),
            observaciones TEXT
        );
    """),

    # 6. Revisiones médicas
    ("tblrevisionesmedicas", """
        CREATE TABLE IF NOT EXISTS tblrevisionesmedicas (
            idrevision        SERIAL PRIMARY KEY,
            fecha             DATE,
            hora              TIME,
            prioridad         VARCHAR(50),
            idconv            INT REFERENCES tblconvictos(idconv) ON DELETE CASCADE,
            diagnostico       VARCHAR(255),
            tratamiento       VARCHAR(500),
            medicoresponsable VARCHAR(150),
            proximarevision   DATE
        );
    """),

    # 7. Tratamientos
    ("tbltratamientos", """
        CREATE TABLE IF NOT EXISTS tbltratamientos (
            idtratamiento SERIAL PRIMARY KEY,
            idconv        INT REFERENCES tblconvictos(idconv) ON DELETE CASCADE,
            medicamento   VARCHAR(150),
            dosis         VARCHAR(100),
            frecuencia    VARCHAR(100),
            duracion      VARCHAR(100),
            medico        VARCHAR(150),
            fechainicio   DATE
        );
    """),

    # 8. Derivaciones
    ("tblderivaciones", """
        CREATE TABLE IF NOT EXISTS tblderivaciones (
            idderivacion SERIAL PRIMARY KEY,
            estado       VARCHAR(50),
            idconv       INT REFERENCES tblconvictos(idconv) ON DELETE CASCADE,
            especialidad VARCHAR(150),
            motivo       VARCHAR(255),
            urgencia     VARCHAR(50),
            institucion  VARCHAR(150),
            fecha        DATE
        );
    """),

    # 9. Historial médico
    ("tblhistorial", """
        CREATE TABLE IF NOT EXISTS tblhistorial (
            idhistorial   SERIAL PRIMARY KEY,
            fecha         DATE,
            idconv        INT REFERENCES tblconvictos(idconv) ON DELETE CASCADE,
            tipo          VARCHAR(100),
            diagnostico   VARCHAR(255),
            medico        VARCHAR(150),
            observaciones TEXT
        );
    """),

    # NOTA: los módulos de seguridad y reportes usan un modelo de convicto
    # distinto (tabla `convictos` con id/nombre/apellido) al del módulo
    # principal (`tblconvictos`). Esto es una inconsistencia del código
    # (ver REVISION_FALLAS, punto 8) que debería unificarse. Mientras tanto
    # se crean estas tablas para que esos endpoints no fallen por tabla
    # inexistente.

    # 10. Convictos (modelo usado por seguridad/reportes)
    ("convictos", """
        CREATE TABLE IF NOT EXISTS convictos (
            id            SERIAL PRIMARY KEY,
            nombre        VARCHAR(100) NOT NULL,
            apellido      VARCHAR(100) NOT NULL,
            cedula        VARCHAR(20) UNIQUE,
            fecha_ingreso DATE,
            pabellon      VARCHAR(50),
            activo        BOOLEAN DEFAULT TRUE
        );
    """),

    # 11. Incidentes (módulo seguridad)
    ("incidentes", """
        CREATE TABLE IF NOT EXISTS incidentes (
            id             SERIAL PRIMARY KEY,
            convicto_id    INT REFERENCES convictos(id) ON DELETE CASCADE,
            fecha          DATE,
            tipo_incidente VARCHAR(100),
            descripcion    VARCHAR(500)
        );
    """),

    # 12. Consultas médicas (estadísticas de reportes)
    ("consultasmedicas", """
        CREATE TABLE IF NOT EXISTS consultasmedicas (
            id          SERIAL PRIMARY KEY,
            convicto_id INT REFERENCES convictos(id) ON DELETE CASCADE,
            fecha       DATE,
            diagnostico VARCHAR(255),
            tratamiento VARCHAR(500)
        );
    """),

    # 13. Reportes guardados
    ("reportes", """
        CREATE TABLE IF NOT EXISTS reportes (
            id            SERIAL PRIMARY KEY,
            tipo_reporte  VARCHAR(100),
            asunto        VARCHAR(255),
            fecha         DATE,
            personal_cargo VARCHAR(150),
            cargo_personal VARCHAR(150),
            observaciones TEXT,
            datos         JSONB,
            formato       VARCHAR(20) DEFAULT 'pdf'
        );
    """),
]


def init_database():
    """Inicializar base de datos con esquema compatible con PostgreSQL."""
    conn = None
    try:
        conn = create_connection()
        cursor = conn.cursor()

        for nombre, ddl in TABLAS:
            logger.info(f"Creando tabla '{nombre}'...")
            cursor.execute(ddl)

        conn.commit()
        cursor.close()
        logger.info("¡Base de datos inicializada correctamente con PostgreSQL!")

    except psycopg2.Error as e:
        logger.error(f"Error inicializando base de datos: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    init_database()

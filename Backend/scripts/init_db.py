"""
Script para inicializar la base de datos PostgreSQL en Supabase con tablas principales.
Ejecutar: python Backend/scripts/init_db.py
"""
import psycopg2
import os
from dotenv import load_dotenv
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_connection():
    """Crear conexión a PostgreSQL usando la URL del archivo .env"""
    connection_string = os.getenv(
        'DATABASE_URL',
        'postgresql://postgres.wvxbahbbvjwoqntwwekc:micontraseña@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require'
    )
    return psycopg2.connect(connection_string)

def init_database():
    """Inicializar base de datos con esquema compatible con PostgreSQL"""
    conn = None
    try:
        conn = create_connection()
        cursor = conn.cursor()

        # 1. Tabla de Usuarios (Tratada completamente en minúsculas)
        logger.info("Creando tabla 'usuarios'...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS usuarios (
                "IdUsuario" SERIAL PRIMARY KEY,
                nombrecompleto VARCHAR(150) NOT NULL,
                dni VARCHAR(20) NOT NULL UNIQUE,
                cargo VARCHAR(100) NOT NULL,
                nivelacceso VARCHAR(50) NOT NULL,
                nombreusuario VARCHAR(50) NOT NULL UNIQUE,
                contrasenahash VARCHAR(255) NOT NULL,
                fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Aplicamos el parche de la restricción que busca tu Flask
            ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS m_usuario_pk;
            ALTER TABLE usuarios ADD CONSTRAINT m_usuario_pk PRIMARY KEY ("IdUsuario");
        ''')

        # 2. Tabla de Convictos
        logger.info("Creando tabla 'tblconvictos'...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tblconvictos (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                apellido VARCHAR(100) NOT NULL,
                cedula VARCHAR(20) UNIQUE NOT NULL,
                fecha_ingreso DATE NOT NULL,
                pabellon VARCHAR(50),
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')

        # 3. Tabla de Consultas Médicas
        logger.info("Creando tabla 'tblrevisionesmedicas'...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tblrevisionesmedicas (
                id SERIAL PRIMARY KEY,
                convicto_id INT NOT NULL,
                fecha DATE NOT NULL,
                diagnostico VARCHAR(255),
                tratamiento VARCHAR(500),
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (convicto_id) REFERENCES tblconvictos(id) ON DELETE CASCADE
            );
        ''')

        # 4. Tabla de Incidentes / Movimientos
        logger.info("Creando tabla 'tblmovimientos'...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tblmovimientos (
                id SERIAL PRIMARY KEY,
                convicto_id INT NOT NULL,
                fecha DATE NOT NULL,
                tipo_incidente VARCHAR(100),
                descripcion VARCHAR(500),
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (convicto_id) REFERENCES tblconvictos(id) ON DELETE CASCADE
            );
        ''')

        conn.commit()
        cursor.close()
        logger.info("¡Base de datos de Supabase inicializada correctamente con Postgres!")

    except psycopg2.Error as e:
        logger.error(f"Error inicializando base de datos en Supabase: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    init_database()
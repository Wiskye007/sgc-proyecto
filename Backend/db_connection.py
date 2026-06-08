import psycopg2
from psycopg2.extras import RealDictCursor
import logging
from contextlib import contextmanager
import os
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

class DatabaseConnection:
    """Gestor de conexiones a PostgreSQL en Supabase"""
    def __init__(self):
        load_dotenv()
        self.connection_string = os.getenv("DATABASE_URL")
        if not self.connection_string:
            logger.error("¡ERROR CRÍTICO: No se encontró la variable DATABASE_URL en el entorno!")
            raise ValueError("DATABASE_URL no está configurada en el archivo .env")

    @contextmanager
    def get_connection(self):
        """Context manager para obtener conexión a Supabase de forma segura"""
        conn = None
        try:
            conn = psycopg2.connect(self.connection_string)
            yield conn
        except psycopg2.Error as e:
            logger.error(f"Error de conexión a la BD: {e}")
            raise
        finally:
            if conn:
                conn.close()

    def execute_query(self, query, params=None):
        """Ejecutar una consulta SELECT (Login y Lecturas)"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                if query and "?" in query:
                    query = query.replace("?", "%s")
                
                if query and "Usuarios" in query:
                    query = query.replace("Usuarios", "usuarios")

                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)

                result = cursor.fetchall()
                cursor.close()

                MAPEO_EXCEPCIONES = {
                    'contrasenahash': 'ContrasenaHash', 'idusuario': 'IdUsuario',
                    'nombreusuario': 'NombreUsuario', 'nombrecompleto': 'NombreCompleto',
                    'fecha_ingreso': 'FechaIngreso', 'fechaingreso': 'FechaIngreso',
                    'idconducta': 'IDConducta', 'idvisita': 'IDVisita',
                    'dnivisitante': 'DNIVisitante', 'dni_visitante': 'DNIVisitante',
                    'fechainicio': 'FechaInicio', 'fechafin': 'FechaFin',
                    'medicoresponsable': 'MedicoResponsable', 'idhistorial': 'IDHistorial',
                    'proximarevision': 'ProximaRevision'
                }

                resultados_normalizados = []
                for row in result:
                    row_normalizada = {**row}
                    
                    for k, v in row.items():
                        row_normalizada[k.capitalize()] = v

                    for k, v in row.items():
                        key_lower = k.lower()
                        
                        if key_lower in MAPEO_EXCEPCIONES:
                            row_normalizada[MAPEO_EXCEPCIONES[key_lower]] = v
                        
                        if 'conv' in key_lower or key_lower == 'id':
                            row_normalizada['IDConv'] = v
                            row_normalizada['IDConvicto'] = v
                            row_normalizada['idconv'] = v
                        
                        if key_lower.startswith('id') and len(key_lower) > 2:
                            palabra_limpia = k[2:] if k.lower().startswith('id') else k
                            key_camel_id = f"ID{palabra_limpia.capitalize()}"
                            row_normalizada[key_camel_id] = v

                        if key_lower == 'idmovimiento' or key_lower == 'idmov' or 'mov' in key_lower:
                            row_normalizada['IDMov'] = v
                            row_normalizada['IDMovimiento'] = v
                        
                        if 'autorizado' in key_lower: row_normalizada['AutorizadoPor'] = v
                        if 'registrado' in key_lower: row_normalizada['RegistradoPor'] = v
                        
                        if key_lower == 'dni': row_normalizada['DNI'] = v

                    if 'dni_visitante' in row:
                        row_normalizada['DNIVisitante'] = row['dni_visitante']
                    elif 'dnivisitante' in row:
                        row_normalizada['DNIVisitante'] = row['dnivisitante']
                    else:
                        row_normalizada['DNIVisitante'] = row.get('dni', '00000000')

                    if 'nombre_visitante' in row:
                        row_normalizada['Visitante'] = row['nombre_visitante']
                    elif 'visitante' in row:
                        row_normalizada['Visitante'] = row['visitante']

                    if 'fecha_ingreso' in row or 'fechaingreso' in row:
                        valor_fecha = row.get('fecha_ingreso', row.get('fechaingreso'))
                        row_normalizada['fecha_ingreso'] = valor_fecha

                    for campo_fecha in ['Fecha', 'fecha', 'FechaIngreso', 'fecha_ingreso', 'FechaInicio', 'fechainicio', 'FechaFin', 'fechafin', 'ProximaRevision', 'proximarevision']:
                        if campo_fecha in row_normalizada and row_normalizada[campo_fecha]:
                            fecha_str = str(row_normalizada[campo_fecha])
                            if '/' in fecha_str and len(fecha_str.split('/')) == 3:
                                partes = fecha_str.split('/')
                                row_normalizada[campo_fecha] = f"{partes[2]}-{partes[1]}-{partes[0]}"

                    resultados_normalizados.append(row_normalizada)
                return resultados_normalizados

        except Exception as e:
                print(f"Error en la normalización o query: {e}")

        except psycopg2.Error as e:
            logger.error(f"Error ejecutando consulta a la BD: {e}")
            raise

    def execute_update(self, query, params=None):
        """Ejecutar una consulta INSERT, UPDATE o DELETE (Registro)"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                if query and "?" in query:
                    query = query.replace("?", "%s")
                
                if query and "Usuarios" in query:
                    query = query.replace("Usuarios", "usuarios")

                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)

                conn.commit()
                rows_affected = cursor.rowcount
                cursor.close()
                return {'success': True, 'rows_affected': rows_affected}
        except psycopg2.Error as e:
            logger.error(f"Error ejecutando update en la BD: {e}")
            raise

# Instancia global
db = DatabaseConnection()
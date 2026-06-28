import psycopg2
from psycopg2.extras import RealDictCursor
import logging
from contextlib import contextmanager
import os
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

class DatabaseConnection:
    def __init__(self):
        load_dotenv()
        self.connection_string = os.getenv("DATABASE_URL")
        if not self.connection_string:
            logger.error("¡ERROR CRÍTICO: No se encontró la variable DATABASE_URL en el entorno!")
            raise ValueError("DATABASE_URL no está configurada en el archivo .env")

    @contextmanager
    def get_connection(self):
        """Context manager para obtener conexión a la BD de forma segura"""
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
        """Ejecutar una consulta SELECT de forma segura y aislada"""
        try:
            with self.get_connection() as conn:
                # Cada consulta abre y cierra su propio cursor de forma aislada
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    # Ejecutamos directamente. Los %s en la query deben coincidir con params
                    cursor.execute(query, params if params else [])
                    result = cursor.fetchall()
                    
                    # Normalización de resultados (Tu lógica original permanece intacta)
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

                        for campo_fecha in ['Fecha', 'fecha', 'FechaIngreso', 'fecha_ingreso', 'FechaInicio', 'fechainicio', 'FechaFin', 'fechafin', 'ProximaRevision', 'proximarevision']:
                            if campo_fecha in row_normalizada and row_normalizada[campo_fecha]:
                                fecha_str = str(row_normalizada[campo_fecha])
                                if '/' in fecha_str and len(fecha_str.split('/')) == 3:
                                    partes = fecha_str.split('/')
                                    row_normalizada[campo_fecha] = f"{partes[2]}-{partes[1]}-{partes[0]}"

                        resultados_normalizados.append(row_normalizada)
                    return resultados_normalizados
        except psycopg2.Error as e:
            logger.error(f"Error de base de datos en execute_query: {e}")
            raise

    def execute_update(self, query, params=None):
        """Ejecutar una consulta INSERT, UPDATE o DELETE de forma aislada"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    # Ejecución directa y segura
                    cursor.execute(query, params if params else [])
                    conn.commit()
                    return {'success': True, 'rows_affected': cursor.rowcount}
        except psycopg2.Error as e:
            logger.error(f"Error de base de datos en execute_update: {e}")
            raise

# Instancia global
db = DatabaseConnection()
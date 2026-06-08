from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv
from datetime import datetime

# Importar blueprints de rutas
from routes import auth_routes, convictos_routes, medico_routes, seguridad_routes, reportes_routes

load_dotenv()

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Crear aplicación Flask
app = Flask(__name__)

# Configuración
app.config['JSON_SORT_KEYS'] = False
app.config['ENV'] = os.getenv('FLASK_ENV', 'development')

# CONFIGURACIÓN DE CORS
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://192.168.18.37:3000"]}},
     supports_credentials=True)

# Registrar blueprints
app.register_blueprint(auth_routes.bp)
app.register_blueprint(convictos_routes.bp)
app.register_blueprint(medico_routes.bp)
app.register_blueprint(seguridad_routes.bp)
app.register_blueprint(reportes_routes.bp)


# Rutas de salud
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'SGC API'
    }), 200


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Ruta no encontrada', 'status': 404}), 404


@app.errorhandler(500)
def server_error(error):
    logger.error(f'Error del servidor: {str(error)}')
    return jsonify({'error': 'Error interno del servidor', 'status': 500}), 500


if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config['ENV'] == 'development')

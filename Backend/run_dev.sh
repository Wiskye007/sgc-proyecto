#!/bin/bash
# Script para ejecutar el servidor Flask en desarrollo

# Activar entorno virtual si existe
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Instalar dependencias si es necesario
pip install -r requirements.txt

# Ejecutar Flask
python -m flask --app backend.app run --debug

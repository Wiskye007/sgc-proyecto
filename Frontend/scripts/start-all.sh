#!/bin/bash
set -e

echo "=== SGC Sistema de Gestión Carcelaria (Supabase Cloud) ==="
echo ""

# 1. CONFIGURAR Y ACTIVAR BACKEND FLASK
echo "Preparando el Backend..."
if [ ! -d ".venv" ]; then
    echo "Creando entorno virtual Python (.venv)..."
    python3 -m venv .venv
fi

# Activar el entorno virtual local
source .venv/bin/activate

echo "Instalando dependencias del Backend..."
# Apuntamos a la nueva ubicación del requirements
pip install -r Backend/requirements.txt

# 2. CONFIGURAR FRONTEND NEXT.JS
echo "Preparando el Frontend..."
cd Frontend
echo "Instalando dependencias de Node.js..."
npm install
cd ..

echo ""
echo "=== Iniciando Servicios en Simultáneo ==="
echo "Backend corriendo en: http://localhost:5000"
echo "Frontend corriendo en: http://localhost:3000"
echo "Presiona Ctrl + C para apagar todos los servicios."
echo ""

# 3. LANZAR SERVICIOS
# Lanzar Backend (Flask) en segundo plano
python Backend/app.py &
BACKEND_PID=$!

# Lanzar Frontend (Next.js) en segundo plano
cd Frontend && npm run dev &
FRONTEND_PID=$!

# Atrapar la señal de salida (Ctrl+C) para apagar ambos procesos limpiamente
trap "echo 'Apagando servicios...'; kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
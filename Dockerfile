FROM python:3.11-slim as backend-build
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    odbcinst1debian2 \
    unixodbc \
    unixodbc-dev \
    freetds-dev \
    gcc g++ \
    libssl-dev \
    libsasl2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY Backend/requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

FROM node:18-alpine as frontend-build
WORKDIR /app
COPY Frontend/package*.json ./
RUN npm ci
COPY Frontend/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    odbcinst1debian2 \
    unixodbc \
    freetds-dev \
    libssl-dev \
    libsasl2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=backend-build /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-build /usr/local/bin /usr/local/bin

COPY Backend/ ./backend/
COPY config.py .

COPY --from=frontend-build /app/dist /app/frontend/static

EXPOSE 5000 3000

CMD ["python", "backend/app.py"]
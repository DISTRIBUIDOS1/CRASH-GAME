Crash Game – Laboratorio de Sistemas Distribuidos

Este proyecto implementa un juego tipo “Crash” en tiempo real utilizando una arquitectura distribuida basada en Docker, con soporte para replicación de base de datos y alta disponibilidad.

Características principales

* Backend en Node.js con conexión a PostgreSQL.
* Frontend web sencillo para visualizar y jugar.
* Balanceo de carga y proxy inverso con Nginx.
* Base de datos primaria + réplicas configuradas para garantizar disponibilidad.
* Orquestación con Docker Compose para simplificar el despliegue.

Instalación y ejecución
1. Clonar el repositorio
git clone https://github.com/DISTRIBUIDOS1/CRASH-GAME.git
cd CRASH-GAME

2. Construir y levantar los contenedores, etando dentro de la carpeta backend ejecutar:
docker-compose up --build

3. En su navegador, entre a "localhost", sin necesidad de colocar el puerto, el programa lo asignara a un servidor automaticamente

📂 Estructura del proyecto

```text
  CRASH-GAME/
  ├── backend/           # API Node.js
  ├── public/          # Interfaz web
  ├── nginx/             # Configuración de proxy inverso
  ├── db-primary/        # Configuración PostgreSQL primario
  ├── db-replica1/       # Configuración PostgreSQL réplica 1
  ├── db-replica2/       # Configuración PostgreSQL réplica 2
  ├── docker-compose.yml # Orquestación de servicios
  └── README.md          # Documentación

Presentado por:
Carlos Manrique
María Medina
Laura Malagón

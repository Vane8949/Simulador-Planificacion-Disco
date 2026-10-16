# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import disk  # Importamos nuestra nueva ruta de discos

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Aquí registrarás todas tus rutas en el futuro
# Le ponemos un prefijo "/disk" para que no choque con otras cosas
app.include_router(disk.router, prefix="/disk", tags=["Planificación de Disco"])

# Si mañana agregas algoritmos de CPU, harías:
# from routers import cpu
# app.include_router(cpu.router, prefix="/cpu")
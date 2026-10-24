from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend import disk_algorithms

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"mensaje": "¡El servidor está funcionando correctamente!"}

app.include_router(disk_algorithms.router, prefix="/disk", tags=["Planificación de Disco"])
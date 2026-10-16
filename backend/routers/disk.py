# backend/routers/disk.py
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from disk_algorithms import DiskScheduler

router = APIRouter()

class SimulationRequest(BaseModel):
    cylinders: int
    initial_pos: int
    requests: List[int]
    time_per_cylinder: float = 1.0

# Nota que ahora la ruta principal de este archivo será "/simulate"
@router.post("/simulate")
def run_simulation(data: SimulationRequest):
    scheduler = DiskScheduler(data.cylinders, data.initial_pos, data.requests, data.time_per_cylinder)
    
    results = {
        "FCFS": scheduler.fcfs(),
        "SSTF": scheduler.sstf(),
        "SCAN": scheduler.scan(),
        "C-SCAN": scheduler.c_scan(),
        "LOOK": scheduler.look(),
        "C-LOOK": scheduler.c_look()
    }
    
    return results
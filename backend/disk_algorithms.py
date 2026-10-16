class DiskScheduler:
    def __init__(self, cylinders, initial_pos, requests, time_per_cylinder_ms=1.0):
        self.cylinders = cylinders
        self.initial_pos = initial_pos
        self.requests = requests
        self.time_per_cylinder_ms = time_per_cylinder_ms

    def fcfs(self):
        """First-Come, First-Served"""
        path = [self.initial_pos] + self.requests
        total_movement = sum(abs(path[i+1] - path[i]) for i in range(len(path) - 1))
        return self._build_metrics("FCFS", path, total_movement)

    def sstf(self):
        """Shortest Seek Time First"""
        path = [self.initial_pos]
        pending = self.requests.copy()
        current_pos = self.initial_pos
        total_movement = 0

        while pending:
            closest = min(pending, key=lambda x: abs(x - current_pos))
            total_movement += abs(closest - current_pos)
            current_pos = closest
            path.append(current_pos)
            pending.remove(closest)

        return self._build_metrics("SSTF", path, total_movement)

    def scan(self, direction="up"):
        """SCAN (Elevador)"""
        path = [self.initial_pos]
        left = sorted([r for r in self.requests if r < self.initial_pos])
        right = sorted([r for r in self.requests if r >= self.initial_pos])

        if direction == "up":
            if right or left:
                path.extend(right)
                # Toca el final del disco si hay elementos pendientes en el lado opuesto
                if left and path[-1] != self.cylinders - 1:
                    path.append(self.cylinders - 1)
                path.extend(reversed(left))
        else:
            if left or right:
                path.extend(reversed(left))
                # Toca el inicio del disco
                if right and path[-1] != 0:
                    path.append(0)
                path.extend(right)

        total_movement = sum(abs(path[i] - path[i-1]) for i in range(1, len(path)))
        return self._build_metrics("SCAN", path, total_movement)

    def c_scan(self, direction="up"):
        """C-SCAN (Circular SCAN)"""
        path = [self.initial_pos]
        left = sorted([r for r in self.requests if r < self.initial_pos])
        right = sorted([r for r in self.requests if r >= self.initial_pos])

        if direction == "up":
            if right or left:
                path.extend(right)
                if left:
                    if path[-1] != self.cylinders - 1:
                        path.append(self.cylinders - 1)
                    path.append(0)  # Salto circular al inicio
                    path.extend(left)
        else:
            if left or right:
                path.extend(reversed(left))
                if right:
                    if path[-1] != 0:
                        path.append(0)
                    path.append(self.cylinders - 1)  # Salto circular al final
                    path.extend(reversed(right))

        total_movement = sum(abs(path[i] - path[i-1]) for i in range(1, len(path)))
        return self._build_metrics("C-SCAN", path, total_movement)

    def look(self, direction="up"):
        """LOOK"""
        path = [self.initial_pos]
        left = sorted([r for r in self.requests if r < self.initial_pos])
        right = sorted([r for r in self.requests if r >= self.initial_pos])

        if direction == "up":
            path.extend(right)
            path.extend(reversed(left))  # No va hasta el final, solo hasta la última solicitud
        else:
            path.extend(reversed(left))
            path.extend(right)

        total_movement = sum(abs(path[i] - path[i-1]) for i in range(1, len(path)))
        return self._build_metrics("LOOK", path, total_movement)

    def c_look(self, direction="up"):
        """C-LOOK"""
        path = [self.initial_pos]
        left = sorted([r for r in self.requests if r < self.initial_pos])
        right = sorted([r for r in self.requests if r >= self.initial_pos])

        if direction == "up":
            path.extend(right)
            path.extend(left)  # Salto circular a la solicitud más baja, no al cilindro 0
        else:
            path.extend(reversed(left))
            path.extend(reversed(right))

        total_movement = sum(abs(path[i] - path[i-1]) for i in range(1, len(path)))
        return self._build_metrics("C-LOOK", path, total_movement)

    def _build_metrics(self, name, path, total_movement):
        num_requests = len(self.requests)
        
        total_seek_time_ms = total_movement * self.time_per_cylinder_ms
        avg_seek_time_ms = total_seek_time_ms / num_requests if num_requests > 0 else 0
        
        wait_times_ms = []
        accumulated_movement = 0
        for i in range(1, len(path)):
            accumulated_movement += abs(path[i] - path[i-1])
            wait_times_ms.append(accumulated_movement * self.time_per_cylinder_ms)
            
        avg_wait_time_ms = sum(wait_times_ms) / num_requests if num_requests > 0 else 0

        return {
            "algorithm": name,
            "path": path,
            "total_movement": total_movement,
            "total_time_ms": round(total_seek_time_ms, 2),
            "avg_seek_time": round(avg_seek_time_ms, 2),
            "avg_wait_time": round(avg_wait_time_ms, 2),
            "total_requests": num_requests
        }
let simulationData = null;
let animationFrameId = null;
let isPlaying = false;
let currentStepIndex = 0;
let currentPos = 0;
let targetPos = 0;
let animProgress = 0; 
let speedMultiplier = 0.05;

const canvas = document.getElementById('diskCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const colorMap = {
    'FCFS': '#2d88eb',
    'SSTF': '#28b473',
    'SCAN': '#f39c12',
    'C-SCAN': '#7c5cdb',
    'LOOK': '#00b4d8',
    'C-LOOK': '#e8437f'
};

const form = document.getElementById('simulation-form');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        try {
            const elCylinders = document.getElementById('cylinders');
            const elInitial = document.getElementById('initialPos');
            const elTime = document.getElementById('timePerCylinder');
            const elRequests = document.getElementById('requests');

            if (!elCylinders || !elInitial || !elTime || !elRequests) {
                alert("Error de interfaz: Falta un ID en el formulario HTML.");
                return;
            }

            const cylinders = parseInt(elCylinders.value) || 200;
            const initialPos = parseInt(elInitial.value) || 0;
            const timePerCylinder = parseFloat(elTime.value) || 1.0;
            const requests = elRequests.value.split(',').map(num => parseInt(num.trim())).filter(n => !isNaN(n));

            let selectedAlg = "FCFS"; 
            if (document.getElementById('fixed-algorithm')) {
                selectedAlg = document.getElementById('fixed-algorithm').value;
            } else if (document.getElementById('algorithm-select')) {
                selectedAlg = document.getElementById('algorithm-select').value;
            }

            const payload = {
                cylinders: cylinders,
                initial_pos: initialPos,
                time_per_cylinder_ms: timePerCylinder,
                requests: requests,
                algorithm: selectedAlg 
            };

            const response = await fetch('http://127.0.0.1:8000/disk/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error del servidor:", errorData);
                alert("El servidor rechazó los datos: " + (errorData.detail || "Verifica los valores ingresados."));
                return;
            }

            const rawData = await response.json();
            
            simulationData = {};
            simulationData[rawData.algorithm] = rawData;
            
            // Si estas dos funciones no existen abajo, JavaScript colapsa
            renderTable(simulationData);
            
            if (canvas) {
                const maxPathLength = Math.max(...Object.values(simulationData).map(alg => alg.path.length));
                canvas.height = Math.max(300, maxPathLength * 30 + 60); 
            }

            initAnimation();
            
        } catch (error) {
            alert("Ocurrió un error. Revisa que el servidor de Python esté activo.");
            console.error("Error técnico:", error);
        }
    });
}

const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const algSelect = document.getElementById('algorithm-select');

if (btnPlay) btnPlay.addEventListener('click', () => { isPlaying = true; });
if (btnPause) btnPause.addEventListener('click', () => { isPlaying = false; });
if (btnReset) btnReset.addEventListener('click', () => { initAnimation(); });
if (algSelect) algSelect.addEventListener('change', () => { initAnimation(); });

function initAnimation() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    let selectedAlg = "FCFS"; 
    if (document.getElementById('fixed-algorithm')) {
        selectedAlg = document.getElementById('fixed-algorithm').value;
    } else if (document.getElementById('algorithm-select')) {
        selectedAlg = document.getElementById('algorithm-select').value;
    }

    if (!simulationData || !simulationData[selectedAlg]) return;

    const path = simulationData[selectedAlg].path;
    currentStepIndex = 0;
    currentPos = path[0];
    targetPos = path[1] !== undefined ? path[1] : path[0];
    animProgress = 0;
    isPlaying = true;

    drawDiskState(currentPos, path.slice(0, 1), path);
    animate();
}

function animate() {
    let selectedAlg = "FCFS";
    if (document.getElementById('fixed-algorithm')) {
        selectedAlg = document.getElementById('fixed-algorithm').value;
    } else if (document.getElementById('algorithm-select')) {
        selectedAlg = document.getElementById('algorithm-select').value;
    }

    if (!simulationData || !simulationData[selectedAlg]) return;
    const path = simulationData[selectedAlg].path;

    if (isPlaying && currentStepIndex < path.length - 1) {
        animProgress += speedMultiplier;

        if (animProgress >= 1.0) {
            animProgress = 0;
            currentStepIndex++;
            currentPos = path[currentStepIndex];
            
            if (currentStepIndex < path.length - 1) {
                targetPos = path[currentStepIndex + 1];
            } else {
                isPlaying = false; 
            }
        }
    }

    const interpolatedHeadPos = currentPos + (targetPos - currentPos) * animProgress;
    const visitedPath = path.slice(0, currentStepIndex + 1);
    
    drawDiskState(interpolatedHeadPos, visitedPath, path);
    animationFrameId = requestAnimationFrame(animate);
}

function drawDiskState(headPos, visitedPath, fullPath) {
    if (!ctx) return;
    const elCylinders = document.getElementById('cylinders');
    const totalCylinders = elCylinders ? parseInt(elCylinders.value) : 200;
    
    let selectedAlg = "FCFS";
    if (document.getElementById('fixed-algorithm')) {
        selectedAlg = document.getElementById('fixed-algorithm').value;
    } else if (document.getElementById('algorithm-select')) {
        selectedAlg = document.getElementById('algorithm-select').value;
    }

    const lineColor = colorMap[selectedAlg] || '#2d88eb';
    
    const width = canvas.width;
    const height = canvas.height;
    
    const paddingLeft = 60;
    const paddingRight = 40;
    const paddingTop = 40;
    const paddingBottom = 40;
    
    const usableWidth = width - paddingLeft - paddingRight;
    const usableHeight = height - paddingTop - paddingBottom;
    
    const stepY = usableHeight / Math.max(1, fullPath.length - 1);

    const getX = (cylinder) => paddingLeft + (cylinder / (totalCylinders - 1)) * usableWidth;
    const getY = (stepIndex) => paddingTop + (stepIndex * stepY);

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    let stepCyl = Math.ceil(totalCylinders / 10);
    if (stepCyl === 0) stepCyl = 1;

    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    for (let c = 0; c <= totalCylinders; c += stepCyl) {
        const x = getX(c);
        ctx.beginPath();
        ctx.moveTo(x, paddingTop - 10);
        ctx.lineTo(x, height - paddingBottom);
        ctx.stroke();
        ctx.fillText(c, x, paddingTop - 15);
    }
    
    if (totalCylinders % stepCyl !== 0) {
         ctx.fillText(totalCylinders - 1, getX(totalCylinders - 1), paddingTop - 15);
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    fullPath.forEach((_, idx) => {
        const y = getY(idx);
        ctx.beginPath();
        ctx.moveTo(paddingLeft - 10, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();
        ctx.fillText(idx, paddingLeft - 20, y);
    });

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Cilindros", width / 2, paddingTop - 30);
    
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Cola (Tiempo)", 0, 0);
    ctx.restore();

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    
    if (visitedPath.length > 0) {
        ctx.moveTo(getX(visitedPath[0]), getY(0));
        
        for (let i = 1; i < visitedPath.length; i++) {
            ctx.lineTo(getX(visitedPath[i]), getY(i));
        }
        
        if (isPlaying && currentStepIndex < fullPath.length - 1) {
            const currentY = getY(currentStepIndex) + (getY(currentStepIndex + 1) - getY(currentStepIndex)) * animProgress;
            ctx.lineTo(getX(headPos), currentY);
        }
        ctx.stroke();
    }

    fullPath.forEach((cyl, idx) => {
        if (idx <= currentStepIndex) {
            const x = getX(cyl);
            const y = getY(idx);
            const isStart = idx === 0;

            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = isStart ? '#28b473' : '#e8437f'; 
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            ctx.fillStyle = '#334155';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(cyl, x + 10, y - 10);
        }
    });

    let currentYAnim = getY(currentStepIndex);
    if (isPlaying && currentStepIndex < fullPath.length - 1) {
        currentYAnim += (getY(currentStepIndex + 1) - getY(currentStepIndex)) * animProgress;
    }
    
    const hX = getX(headPos);
    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(hX, currentYAnim, 6, 0, Math.PI * 2);
    ctx.fill();
}

function renderTable(data) {
    const tbody = document.querySelector('#results-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    let selectedAlg = null;
    if (document.getElementById('fixed-algorithm')) {
        selectedAlg = document.getElementById('fixed-algorithm').value;
    }

    Object.keys(data).forEach(algKey => {
        if (selectedAlg && algKey !== selectedAlg) return; 

        const item = data[algKey];
        const bgColor = colorMap[algKey] || '#64748b';
        
        const row = `<tr>
            <td><span class="badge" style="background-color: ${bgColor}; padding: 5px 10px; color: white; border-radius: 4px; font-weight: bold;">${item.algorithm}</span></td>
            <td>${item.total_movement}</td>
            <td>${item.total_time_ms}</td>
            <td>${item.avg_seek_time.toFixed(2)}</td>
            <td>${item.avg_wait_time.toFixed(2)}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}
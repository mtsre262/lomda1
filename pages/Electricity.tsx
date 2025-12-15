import React, { useState, useEffect, useRef } from 'react';
import { Pause, Play, Activity, Settings, PlusCircle, RotateCcw, Trophy, Undo, Redo, Grid, ImageDown, Mic, MicOff, Battery, Gauge, Trash2, Cable, MousePointer2, CircleGauge, Zap } from 'lucide-react';
import * as d3 from 'd3';
import { CircuitComponent, ComponentType } from '../types';
import { ResizablePanel } from '../components/ResizablePanel';

// --- SOUND EFFECTS ENGINE (Web Audio API) ---
const playSfx = (type: 'click' | 'place' | 'reset' | 'start' | 'stop' | 'switch') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'place':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      case 'switch': // used for clear/reset now
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'reset':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'start':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.4);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      case 'stop':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.2);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
    }
  } catch (e) {
    // Silent fail if audio context blocked or not supported
  }
};

// --- INITIAL CONFIGURATIONS ---
const INITIAL_BUILDER_STATE: CircuitComponent[] = [
    { id: 'src', type: ComponentType.SOURCE, value: 24, label: 'E', x: 100, y: 200 },
];

interface Particle {
  id: number;
  pathId: string;
  t: number;
}

// --- MASTERY TASKS CONFIGURATION ---
const MASTERY_TASKS = [
    { id: 'ADD_RES', label: 'بناء الدائرة (إضافة مقاوم)' },
    { id: 'ADD_METER', label: 'استخدام أجهزة القياس' },
    { id: 'MODIFY_SRC', label: 'تغيير جهد المصدر' },
    { id: 'MODIFY_RES', label: 'تغيير قيم المقاومات' },
    { id: 'FREEZE', label: 'تشغيل/تجميد المحاكاة' },
];

interface Measurements {
    [componentId: string]: {
        v: number; // Potential at component input (Node Voltage)
        i: number; // Current through component
        drop: number; // Voltage drop across component
    }
}

export const Electricity: React.FC<{ onAwardXp?: (amount: number) => void }> = ({ onAwardXp }) => {
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [history, setHistory] = useState<CircuitComponent[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isSnapToGrid, setIsSnapToGrid] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  // const progressPercent = Math.round((completedTasks.length / MASTERY_TASKS.length) * 100);

  const [physicsState, setPhysicsState] = useState({
    totalCurrent: 0,
    topCurrent: 0,
    bottomCurrent: 0,
    totalResistance: 0,
    measurements: {} as Measurements
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const pathNodesRef = useRef<{ [key: string]: SVGPathElement | null }>({});
  const visualPathRefs = useRef<{ [key: string]: SVGPathElement | null }>({});
  
  const spawnAccumulatorRef = useRef(0);
  const FIXED_SPACING = 0.08; 

  // --- INITIAL LOAD ---
  useEffect(() => {
    const savedState = localStorage.getItem('electro_circuit_builder_state');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            if (parsed && Array.isArray(parsed.components) && parsed.components.length > 0) {
                setComponents(parsed.components);
                setHistory([parsed.components]);
                setHistoryIndex(0);
            } else {
                resetToInitial();
            }
        } catch (e) {
            resetToInitial();
        }
    } else {
        resetToInitial();
    }
  }, []);

  const resetToInitial = () => {
      const initial = INITIAL_BUILDER_STATE.map(c => ({...c}));
      setComponents(initial);
      setHistory([initial]);
      setHistoryIndex(0);
  };

  useEffect(() => {
      if (components.length > 0) {
        localStorage.setItem('electro_circuit_builder_state', JSON.stringify({ components }));
      }
  }, [components]);

  // --- HISTORY ---
  const pushToHistory = (newComponents: CircuitComponent[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newComponents);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
      if (historyIndex > 0) {
          playSfx('click');
          setHistoryIndex(historyIndex - 1);
          setComponents(history[historyIndex - 1]);
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          playSfx('click');
          setHistoryIndex(historyIndex + 1);
          setComponents(history[historyIndex + 1]);
      }
  };

  // --- ACTIONS ---
  const markTaskComplete = (taskId: string) => {
      if (!completedTasks.includes(taskId)) {
          setCompletedTasks(prev => [...prev, taskId]);
          if (onAwardXp) onAwardXp(50);
      }
  };

  const handleClearBoard = () => {
      playSfx('switch');
      resetToInitial(); 
      particlesRef.current = []; 
      spawnAccumulatorRef.current = 0;
      setIsAddMode(false);
      const initial = INITIAL_BUILDER_STATE.map(c => ({...c}));
      pushToHistory(initial);
  };

  const handleReset = () => {
    playSfx('reset');
    particlesRef.current = [];
    spawnAccumulatorRef.current = 0;
    setIsPlaying(true);
  };

  const handleExportImage = () => {
      if (!svgRef.current) return;
      playSfx('click');
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      canvas.width = 800;
      canvas.height = 600;
      const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
          if (ctx) {
            ctx.fillStyle = "#050508";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const pngUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = pngUrl;
            link.download = `my_circuit_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
      };
      img.src = url;
  };

  const handleValueChange = (id: string, newValue: number) => {
      const safeValue = newValue < 1 ? 1 : newValue;
      const newComponents = components.map(c => c.id === id ? { ...c, value: safeValue } : c);
      setComponents(newComponents);
      if (id === 'src') markTaskComplete('MODIFY_SRC');
      else markTaskComplete('MODIFY_RES');
  };

  const handleLabelChange = (id: string, newLabel: string) => {
    const newComponents = components.map(c => c.id === id ? { ...c, label: newLabel } : c);
    setComponents(newComponents);
    pushToHistory(newComponents);
  };

  const handleDeleteComponent = (id: string) => {
      if (id === 'src') return; 
      playSfx('click');
      const newComponents = components.filter(c => c.id !== id);
      setComponents(newComponents);
      pushToHistory(newComponents);
  };

  const createNewComponent = (type: ComponentType, x: number, y: number): CircuitComponent => {
      let finalY = y;
      const SNAP_THRESHOLD = 50;
      
      if (Math.abs(y - 100) < SNAP_THRESHOLD) finalY = 100;
      else if (Math.abs(y - 200) < SNAP_THRESHOLD) finalY = 200;
      else if (Math.abs(y - 300) < SNAP_THRESHOLD) finalY = 300;
      
      const finalX = isSnapToGrid ? Math.round(x / 25) * 25 : x;

      let value = 10;
      let label = '';
      
      if (type === ComponentType.RESISTOR) {
          label = `R${components.filter(c => c.type === ComponentType.RESISTOR).length + 1}`;
      } else if (type === ComponentType.SOURCE) {
          label = `E${components.filter(c => c.type === ComponentType.SOURCE).length + 1}`;
          value = 20;
      } else if (type === ComponentType.AMMETER) {
          label = `A`;
          value = 0; // Ideal Ammeter has 0 resistance
      } else if (type === ComponentType.VOLTMETER) {
          label = `V`;
          value = 0; // Not used for calculation
      } else {
          label = `W`;
          value = 0;
      }

      return {
          id: `${type.toLowerCase()}_${Date.now()}`,
          type,
          value,
          label,
          x: finalX,
          y: finalY
      };
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isAddMode) return;
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    const newComponent = createNewComponent(ComponentType.RESISTOR, svgP.x, svgP.y);
    const newComponents = [...components, newComponent];
    setComponents(newComponents);
    pushToHistory(newComponents);
    
    playSfx('place');
    setIsAddMode(false); 
    markTaskComplete('ADD_RES');
    if (onAwardXp) onAwardXp(20);
  };

  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
      e.dataTransfer.setData('componentType', type);
      playSfx('click');
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('componentType') as ComponentType;
      if (!type || !svgRef.current) return;

      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

      if (type === ComponentType.SOURCE) return; 

      const newComponent = createNewComponent(type, svgP.x, svgP.y);
      const newComponents = [...components, newComponent];
      setComponents(newComponents);
      pushToHistory(newComponents);
      
      playSfx('place');
      if (type === ComponentType.RESISTOR) markTaskComplete('ADD_RES');
      if (type === ComponentType.AMMETER || type === ComponentType.VOLTMETER) markTaskComplete('ADD_METER');
      if (onAwardXp) onAwardXp(20);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleTogglePlay = () => {
      const newState = !isPlaying;
      setIsPlaying(newState);
      playSfx(newState ? 'start' : 'stop');
      if (!newState) markTaskComplete('FREEZE');
  }

  // --- CIRCUIT GEOMETRY ---
  const circuitGeometry = React.useMemo(() => {
    // NOTE: Filter out Voltmeters for path generation so they don't break the wire
    const structuralComponents = components.filter(c => c.type !== ComponentType.VOLTMETER);
    
    const maxX = Math.max(900, ...structuralComponents.map(c => c.x + 100));
    
    const topComps = structuralComponents.filter(c => c.y < 150).sort((a,b) => a.x - b.x);
    const midComps = structuralComponents.filter(c => c.y >= 150 && c.y <= 250).sort((a,b) => a.x - b.x);
    const botComps = structuralComponents.filter(c => c.y > 250).sort((a,b) => a.x - b.x);

    const generateLinePath = (y: number, comps: CircuitComponent[], startX: number, endX: number) => {
        let d = `M ${startX} ${y}`;
        let currentX = startX;
        comps.forEach(comp => {
            // Only break line for Resistors and Ammeters (Series components)
            if (comp.x - 25 > currentX) d += ` L ${comp.x - 25} ${y}`;
            d += ` M ${comp.x + 25} ${y}`;
            currentX = comp.x + 25;
        });
        if (currentX < endX) d += ` L ${endX} ${y}`;
        return d;
    };

    const paths = { main: '', top: '', bottom: '', return: '' };
    const startX = 100;
    const splitX = 250; 
    const joinX = maxX;

    const preSplitComps = midComps.filter(c => c.x < splitX);
    paths.main = generateLinePath(200, preSplitComps, 100, splitX);
    paths.top = `M ${splitX} 200 L ${splitX} 100 ` + generateLinePath(100, topComps, splitX, joinX).substring(1) + ` L ${joinX} 200`;
    paths.bottom = `M ${splitX} 200 L ${splitX} 300 ` + generateLinePath(300, botComps, splitX, joinX).substring(1) + ` L ${joinX} 200`;
    paths.return = `M ${joinX} 200 L ${joinX + 50} 200 L ${joinX + 50} 400 L 50 400 L 50 200 L 100 200`;
    const viewBox = `0 0 ${joinX + 100} 450`;

    return { paths, maxX, viewBox, preSplitComps, topComps, botComps };
  }, [components]);

  // --- PHYSICS ENGINE (UPDATED FOR METERS) ---
  useEffect(() => {
    const E = components.find(c => c.type === ComponentType.SOURCE)?.value || 20;
    
    // Sort components by X for correct node analysis traversal
    const sortComps = (arr: CircuitComponent[]) => arr.sort((a, b) => a.x - b.x);

    // Identify branches
    // Main Branch: Y between 150 and 250, excluding Source
    const mainComps = sortComps(components.filter(c => c.y >= 150 && c.y <= 250 && c.type !== ComponentType.SOURCE && c.type !== ComponentType.VOLTMETER));
    // Top Branch: Y < 150
    const topComps = sortComps(components.filter(c => c.y < 150 && c.type !== ComponentType.VOLTMETER));
    // Bottom Branch: Y > 250
    const botComps = sortComps(components.filter(c => c.y > 250 && c.type !== ComponentType.VOLTMETER));

    // Calculate Total Resistance
    const getResistance = (arr: CircuitComponent[]) => arr.reduce((acc, c) => c.type === ComponentType.RESISTOR ? acc + c.value : acc, 0);
    const R_main = getResistance(mainComps);
    const R_top = getResistance(topComps);
    const R_bot = getResistance(botComps);

    let R_parallel = 0;
    if (R_top > 0 && R_bot > 0) {
        R_parallel = (R_top * R_bot) / (R_top + R_bot);
    } else if (R_top > 0) {
        R_parallel = R_top;
    } else if (R_bot > 0) {
        R_parallel = R_bot;
    }

    const R_total = R_main + R_parallel;
    
    // Calculate Currents (Ohm's Law)
    // Avoid division by zero
    const I_total = R_total > 0 ? E / R_total : 0;
    
    // Voltage drop across Main branch
    const V_main_drop = I_total * R_main;
    const V_split = E - V_main_drop; // Voltage at the split node
    
    const I_top = R_top > 0 ? V_split / R_top : 0;
    const I_bot = R_bot > 0 ? V_split / R_bot : 0;

    // Calculate per-component readings (Voltages at specific nodes)
    const measurements: Measurements = {};

    // Helper to process a component's measurements
    const processComp = (c: CircuitComponent, i: number, v: number) => {
        let drop = 0;
        if (c.type === ComponentType.RESISTOR) {
             drop = i * c.value;
        }
        measurements[c.id] = { v: parseFloat(v.toFixed(2)), i: parseFloat(i.toFixed(2)), drop: parseFloat(drop.toFixed(2)) };
        return drop;
    };

    // 1. Traverse Main Branch
    let currentV = E;
    mainComps.forEach(c => {
        const drop = processComp(c, I_total, currentV);
        currentV -= drop;
    });

    // 2. Traverse Top Branch
    currentV = V_split; // Reset to split node voltage
    topComps.forEach(c => {
        const drop = processComp(c, I_top, currentV);
        currentV -= drop;
    });

    // 3. Traverse Bottom Branch
    currentV = V_split; // Reset to split node voltage
    botComps.forEach(c => {
        const drop = processComp(c, I_bot, currentV);
        currentV -= drop;
    });

    // 4. Handle Voltmeters (They just read the potential at their location)
    // We need to approximate their V based on which branch they are near
    components.filter(c => c.type === ComponentType.VOLTMETER).forEach(v => {
        // Simple logic: inherit V from the 'node' they are spatially closest to, or just default to 0 if floating
        // For this sim, we will just assign them the Split Voltage if in parallel section, or E if at start.
        // A better approximation for this grid:
        let val = 0;
        if (v.x < 250) val = E - (I_total * (R_main * (v.x - 100) / 150)); // Linear approx across main wire
        else val = V_split; // Simplified
        measurements[v.id] = { v: parseFloat(Math.max(0, val).toFixed(2)), i: 0, drop: 0 };
    });

    setPhysicsState({
        totalCurrent: parseFloat(I_total.toFixed(2)),
        topCurrent: parseFloat(I_top.toFixed(2)),
        bottomCurrent: parseFloat(I_bot.toFixed(2)),
        totalResistance: parseFloat(R_total.toFixed(2)),
        measurements
    });

  }, [components]);

  // --- ANIMATION LOOP ---
  useEffect(() => {
    if (!isPlaying) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }

    const animate = () => {
      const SPEED_FACTOR = 0.004; 
      const speedTotal = physicsState.totalCurrent * SPEED_FACTOR;
      const speedTop = physicsState.topCurrent * SPEED_FACTOR;
      const speedBottom = physicsState.bottomCurrent * SPEED_FACTOR;

      // Spawn Logic
      if (physicsState.totalCurrent > 0 && physicsState.totalCurrent < 999) {
          spawnAccumulatorRef.current += speedTotal;
          if (spawnAccumulatorRef.current >= FIXED_SPACING) {
            spawnAccumulatorRef.current = 0; 
            particlesRef.current.push({ id: Math.random(), pathId: 'path_main', t: 0 });
          }
      }

      const nextParticles: Particle[] = [];
      particlesRef.current.forEach(p => {
        let currentSpeed = 0;
        if (p.pathId === 'path_main' || p.pathId === 'path_return') currentSpeed = speedTotal;
        else if (p.pathId === 'path_top') currentSpeed = speedTop;
        else if (p.pathId === 'path_bottom') currentSpeed = speedBottom;

        // Slow down inside resistors
        const pathEl = pathNodesRef.current[p.pathId];
        if (pathEl) {
            const point = pathEl.getPointAtLength(p.t * pathEl.getTotalLength());
            const isInsideResistor = components.some(c => {
                if (c.type !== ComponentType.RESISTOR) return false;
                const dx = Math.abs(c.x - point.x);
                const dy = Math.abs(c.y - point.y);
                return dx < 30 && dy < 20; 
            });
            if (isInsideResistor) currentSpeed *= 0.3; 
        }

        p.t += currentSpeed;

        if (p.t < 1) {
          nextParticles.push(p);
        } else {
             // Junction Logic
             const totalI = physicsState.totalCurrent || 1;
             if (p.pathId === 'path_main') {
                 const roll = Math.random() * totalI;
                 if (physicsState.topCurrent > 0 && roll < physicsState.topCurrent) {
                     nextParticles.push({ ...p, id: Math.random(), pathId: 'path_top', t: 0 });
                 } else if (physicsState.bottomCurrent > 0) {
                     nextParticles.push({ ...p, id: Math.random(), pathId: 'path_bottom', t: 0 });
                 }
             } else if (p.pathId === 'path_top' || p.pathId === 'path_bottom') {
                 nextParticles.push({ ...p, id: Math.random(), pathId: 'path_return', t: 0 });
             } else if (p.pathId === 'path_return') {
                 nextParticles.push({ ...p, id: Math.random(), pathId: 'path_main', t: 0 });
             }
        }
      });
      particlesRef.current = nextParticles;

      // Render Particles
      if (svgRef.current) {
        const svg = d3.select(svgRef.current);
        const dots = svg.select('.particles-layer').selectAll('circle').data(particlesRef.current, (d: any) => d.id);
        dots.enter().append('circle')
            .attr('r', 5).attr('fill', '#60a5fa').attr('filter', 'url(#glow)')
            .merge(dots as any)
            .attr('cx', d => {
                const path = pathNodesRef.current[d.pathId];
                return path ? path.getPointAtLength(d.t * path.getTotalLength()).x : 0;
            })
            .attr('cy', d => {
                const path = pathNodesRef.current[d.pathId];
                return path ? path.getPointAtLength(d.t * path.getTotalLength()).y : 0;
            });
        dots.exit().remove();
      }
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying, physicsState, components]);

  return (
    <div className="flex flex-col h-screen text-right font-sans overflow-hidden bg-[#050508]">
      
      {/* TOP BAR */}
      <div className="bg-black/60 backdrop-blur-md border-b border-gray-800 p-2 flex flex-wrap md:flex-nowrap justify-between items-center z-30 shrink-0 gap-3">
        <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-lg border border-gray-800">
             <button onClick={handleClearBoard} className="p-2 rounded-md text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors" title="مسح الدائرة"><Trash2 className="w-4 h-4" /></button>
            <div className="w-[1px] h-4 bg-gray-700 mx-1"></div>
            <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-md text-gray-400 hover:text-white disabled:opacity-30 hover:bg-white/10"><Undo className="w-4 h-4" /></button>
            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-md text-gray-400 hover:text-white disabled:opacity-30 hover:bg-white/10"><Redo className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center gap-2">
            <button onClick={handleReset} className="p-2.5 rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700 transition-all active:scale-95"><RotateCcw className="w-4 h-4" /></button>
            <button onClick={handleTogglePlay} className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all text-sm shadow-lg active:scale-95 ${isPlaying ? 'bg-gradient-to-r from-red-900/80 to-red-800/80 text-red-200 border border-red-500/30' : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border border-green-500/30 hover:brightness-110'}`}>
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span className="hidden sm:inline">{isPlaying ? 'تجميد' : 'تشغيل'}</span>
            </button>
            <button onClick={() => setIsAddMode(!isAddMode)} className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold transition-all text-sm border active:scale-95 ${isAddMode ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'}`}>
                <PlusCircle className="w-4 h-4" /> 
                <span className="hidden sm:inline">{isAddMode ? 'إلغاء' : 'إضافة'}</span>
            </button>
        </div>

        <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-lg border border-gray-800">
             <button onClick={() => setIsSnapToGrid(!isSnapToGrid)} className={`p-2 rounded-md transition-colors ${isSnapToGrid ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}><Grid className="w-4 h-4" /></button>
             <button onClick={() => setIsListening(!isListening)} className={`p-2 rounded-md transition-colors ${isListening ? 'text-red-400 bg-red-500/10 animate-pulse' : 'text-gray-500 hover:text-gray-300'}`}>{isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}</button>
             <button onClick={handleExportImage} className="p-2 rounded-md text-gray-500 hover:text-white hover:bg-white/10"><ImageDown className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-[#050508] relative">
      
        {/* REMOVED PROGRESS OVERLAY (STRIP) HERE */}

        {/* MAIN SIMULATION AREA */}
        <div className="flex-1 relative overflow-hidden bg-[#08080c] flex items-center justify-center">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4c1d95 1px, transparent 1px)', backgroundSize: '25px 25px' }}></div>
            
            {isAddMode && (
                <div className="absolute inset-0 z-10 cursor-crosshair flex items-center justify-center bg-black/20" onClick={handleCanvasClick}>
                    <div className="absolute bottom-20 bg-yellow-500/90 text-black font-bold px-4 py-2 rounded-full shadow-lg pointer-events-none animate-pulse flex items-center gap-2 text-sm">
                        <MousePointer2 className="w-4 h-4" /> {isSnapToGrid ? "اضغط لإضافة مقاوم (محاذاة)" : "اضغط لإضافة مقاوم"}
                    </div>
                </div>
            )}

            <div className="w-full h-full relative">
                <svg ref={svgRef} className="w-full h-full" viewBox={circuitGeometry.viewBox} preserveAspectRatio="xMidYMid meet" onDrop={handleDrop} onDragOver={handleDragOver}>
                    <defs>
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    </defs>
                    <g className="guides" stroke="#ffffff" strokeWidth="1" strokeDasharray="4,4" opacity="0.05"><line x1="100" y1="100" x2="2000" y2="100" /><line x1="100" y1="300" x2="2000" y2="300" /></g>
                    <g className="wiring" stroke="#334155" strokeWidth="4" fill="none">
                        <path d={circuitGeometry.paths.main} />
                        <path ref={(el) => { visualPathRefs.current['path_top'] = el; }} d={circuitGeometry.paths.top} />
                        <path ref={(el) => { visualPathRefs.current['path_bottom'] = el; }} d={circuitGeometry.paths.bottom} />
                        <path d={circuitGeometry.paths.return} />
                    </g>
                    <path id="path_main" d={circuitGeometry.paths.main} ref={(el) => { pathNodesRef.current['path_main'] = el; }} fill="none" opacity="0" />
                    <path id="path_top" d={circuitGeometry.paths.top} ref={(el) => { pathNodesRef.current['path_top'] = el; }} fill="none" opacity="0" />
                    <path id="path_bottom" d={circuitGeometry.paths.bottom} ref={(el) => { pathNodesRef.current['path_bottom'] = el; }} fill="none" opacity="0" />
                    <path id="path_return" d={circuitGeometry.paths.return} ref={(el) => { pathNodesRef.current['path_return'] = el; }} fill="none" opacity="0" />

                    {components.map(comp => (
                        <g key={comp.id} transform={`translate(${comp.x}, ${comp.y})`} className="cursor-pointer group">
                            
                            {/* VISUAL DELETE BUTTON (On Component) */}
                            {comp.type !== ComponentType.SOURCE && (
                                <g 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity" 
                                    transform="translate(20, -30)" 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteComponent(comp.id); }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <circle r="10" fill="#ef4444" />
                                    <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" stroke="white" strokeWidth="2" />
                                </g>
                            )}

                            {/* SOURCE */}
                            {comp.type === ComponentType.SOURCE && (
                                <g>
                                    <circle r="25" fill="#0a0a12" stroke="#eab308" strokeWidth="3" />
                                    <text textAnchor="middle" dy="5" fill="#eab308" fontSize="14" fontWeight="bold">{comp.value}V</text>
                                    <text textAnchor="middle" dy="-35" fill="#eab308" fontSize="14" fontWeight="bold">{comp.label}</text>
                                    <line x1="-10" y1="-8" x2="10" y2="-8" stroke="#eab308" strokeWidth="2" />
                                    <line x1="-5" y1="8" x2="5" y2="8" stroke="#eab308" strokeWidth="2" />
                                </g>
                            )}

                            {/* RESISTOR */}
                            {comp.type === ComponentType.RESISTOR && (
                                <g onClick={(e) => { e.stopPropagation(); }}>
                                    <rect x="-30" y="-25" width="60" height="50" fill="transparent" />
                                    <path d="M -25 0 L -15 0 L -10 -15 L -5 15 L 0 -15 L 5 15 L 10 -15 L 15 0 L 25 0" stroke="#8b5cf6" strokeWidth="3" fill="none" filter="url(#glow)" className="group-hover:stroke-white transition-colors"/>
                                    <text textAnchor="middle" dy="-25" fill="#a78bfa" fontSize="14" fontWeight="bold">{comp.label} ({comp.value}Ω)</text>
                                </g>
                            )}

                            {/* AMMETER */}
                            {comp.type === ComponentType.AMMETER && (
                                <g onClick={(e) => { e.stopPropagation(); }}>
                                    <circle r="22" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
                                    <text textAnchor="middle" dy="-5" fill="#3b82f6" fontSize="12" fontWeight="bold">A</text>
                                    <text textAnchor="middle" dy="12" fill="white" fontSize="11" fontWeight="mono">
                                        {physicsState.measurements[comp.id]?.i || 0}A
                                    </text>
                                </g>
                            )}

                            {/* VOLTMETER - RENDERED "PARALLEL" (Offset) */}
                            {comp.type === ComponentType.VOLTMETER && (
                                <g onClick={(e) => { e.stopPropagation(); }} transform="translate(0, -50)">
                                    {/* Connection Lines */}
                                    <path d="M -15 22 L -15 50" stroke="#ef4444" strokeWidth="2" />
                                    <path d="M 15 22 L 15 50" stroke="#ef4444" strokeWidth="2" />
                                    {/* Meter Body */}
                                    <circle r="22" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
                                    <text textAnchor="middle" dy="-5" fill="#ef4444" fontSize="12" fontWeight="bold">V</text>
                                    <text textAnchor="middle" dy="12" fill="white" fontSize="11" fontWeight="mono">
                                        {physicsState.measurements[comp.id]?.v || 0}V
                                    </text>
                                </g>
                            )}
                        </g>
                    ))}
                    <g className="particles-layer pointer-events-none" />
                </svg>
            </div>
        </div>

        {/* COMPONENT PALETTE */}
        <ResizablePanel initialSize={80} minSize={60} maxSize={120} direction="right" className="bg-black/40 border-r border-electro-primary/20 backdrop-blur-sm z-20 hidden md:flex">
            <div className="w-full h-full flex flex-col items-center py-6 gap-6 overflow-y-auto">
                <div className="text-[10px] text-gray-500 font-bold mb-2">المكونات</div>
                
                <div draggable onDragStart={(e) => handleDragStart(e, ComponentType.RESISTOR)} className="w-12 h-12 bg-electro-secondary/20 rounded-xl border border-electro-secondary/40 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-electro-secondary/40 transition-colors shadow-lg shadow-electro-secondary/10" title="اسحب لإضافة مقاوم">
                    <Activity className="text-electro-accent w-6 h-6" />
                </div>

                <div draggable onDragStart={(e) => handleDragStart(e, ComponentType.AMMETER)} className="w-12 h-12 bg-blue-500/20 rounded-xl border border-blue-500/40 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-blue-500/40 transition-colors shadow-lg shadow-blue-500/10" title="أميتر (Ammeter)">
                    <CircleGauge className="text-blue-400 w-6 h-6" />
                </div>

                <div draggable onDragStart={(e) => handleDragStart(e, ComponentType.VOLTMETER)} className="w-12 h-12 bg-red-500/20 rounded-xl border border-red-500/40 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-red-500/40 transition-colors shadow-lg shadow-red-500/10" title="فولتميتر (Voltmeter)">
                    <Zap className="text-red-400 w-6 h-6" />
                </div>

                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl border border-yellow-500/30 flex items-center justify-center opacity-50 cursor-not-allowed" title="المصدر موجود مسبقاً">
                    <Battery className="text-yellow-400 w-6 h-6" />
                </div>
                
                <div className="mt-auto flex flex-col gap-4">
                    <div className="w-10 h-[1px] bg-gray-700"></div>
                    <div className="text-[10px] text-gray-600 font-bold rotate-90 whitespace-nowrap origin-center">اسحب وأفلت</div>
                </div>
            </div>
        </ResizablePanel>
      </div>

      {/* BOTTOM DASHBOARD */}
      <ResizablePanel initialSize={200} minSize={100} maxSize={400} direction="top" className="bg-black/60 backdrop-blur-md border-t border-electro-primary/30 z-20 shrink-0">
        <div className="w-full h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-gray-800" dir="rtl">
            <div className="w-full md:w-1/3 p-4 md:p-6 flex flex-col justify-center space-y-3 bg-white/5">
                <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2"><Gauge className="w-4 h-4 text-electro-glow" /> الحسابات الحية</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/30 p-2 rounded-lg border border-gray-700">
                        <span className="text-[10px] text-gray-500 block">R(Total)</span>
                        <span className="font-mono text-lg font-bold text-white">{physicsState.totalResistance} Ω</span>
                    </div>
                    <div className="bg-black/30 p-2 rounded-lg border border-yellow-500/30">
                        <span className="text-[10px] text-gray-500 block">I(Total)</span>
                        <span className="font-mono text-lg font-black text-yellow-400">{physicsState.totalCurrent} A</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2"><Settings className="w-4 h-4 text-electro-accent" /> خصائص المكونات</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                        <div className="flex justify-between items-center text-yellow-400 font-bold mb-2">
                            <span className="text-xs">المصدر (V)</span>
                            <input type="number" min="1" max="100" value={components.find(c => c.type === ComponentType.SOURCE)?.value || 0} onChange={(e) => handleValueChange('src', Math.max(1, parseInt(e.target.value) || 1))} className="w-12 bg-yellow-500/20 px-1 py-0.5 rounded text-center border border-yellow-500/30 focus:outline-none focus:border-yellow-400 text-xs font-mono" />
                        </div>
                        <input type="range" min="10" max="60" step="1" value={components.find(c => c.type === ComponentType.SOURCE)?.value || 0} onChange={(e) => handleValueChange('src', parseInt(e.target.value))} className="w-full accent-yellow-400 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    {components.filter(c => c.type === ComponentType.RESISTOR).map(res => (
                        <div key={res.id} className="bg-electro-secondary/10 p-3 rounded-xl border border-electro-secondary/20 hover:border-electro-secondary/50 transition-colors relative group">
                            <button onClick={() => handleDeleteComponent(res.id)} className="absolute top-1 left-1 p-1 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 rounded" title="حذف"><Trash2 className="w-3 h-3" /></button>
                            <div className="flex justify-between items-center text-electro-glow font-bold mb-2 pl-5">
                                <input type="text" value={res.label} onChange={(e) => handleLabelChange(res.id, e.target.value)} className="w-12 bg-transparent border-b border-gray-600 focus:border-white text-xs text-white focus:outline-none" />
                                <div className="flex items-center gap-1">
                                    <input type="number" min="1" max="100" value={res.value} onChange={(e) => handleValueChange(res.id, Math.max(1, parseInt(e.target.value) || 1))} className="w-12 bg-electro-secondary/20 px-1 py-0.5 rounded text-center border border-electro-secondary/30 focus:outline-none focus:border-electro-accent text-xs font-mono text-white" />
                                    <span className="text-[10px] text-gray-400">Ω</span>
                                </div>
                            </div>
                            <input type="range" min="1" max="50" step="1" value={res.value} onChange={(e) => handleValueChange(res.id, parseInt(e.target.value))} onMouseUp={() => pushToHistory(components)} className="w-full accent-electro-secondary h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    ))}
                    
                    {components.filter(c => c.type === ComponentType.AMMETER || c.type === ComponentType.VOLTMETER).map(meter => (
                         <div key={meter.id} className="bg-gray-800/30 p-3 rounded-xl border border-gray-700 hover:border-white/30 transition-colors relative group">
                             <button onClick={() => handleDeleteComponent(meter.id)} className="absolute top-1 left-1 p-1 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 rounded" title="حذف"><Trash2 className="w-3 h-3" /></button>
                             <div className="flex items-center gap-2 mb-1">
                                 {meter.type === ComponentType.AMMETER ? <CircleGauge className="w-4 h-4 text-blue-400"/> : <Zap className="w-4 h-4 text-red-400"/>}
                                 <span className="text-xs font-bold text-gray-300">{meter.type === ComponentType.AMMETER ? 'Ammeter' : 'Voltmeter'}</span>
                             </div>
                             <div className="text-xl font-mono text-white text-center py-1">
                                {meter.type === ComponentType.AMMETER ? 
                                    `${physicsState.measurements[meter.id]?.i || 0} A` : 
                                    `${physicsState.measurements[meter.id]?.v || 0} V`
                                }
                             </div>
                         </div>
                    ))}
                </div>
            </div>
      </ResizablePanel>
    </div>
  );
};
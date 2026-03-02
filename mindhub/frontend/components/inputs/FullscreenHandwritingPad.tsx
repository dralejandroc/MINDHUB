'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  XMarkIcon,
  ArrowUturnLeftIcon,
  TrashIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

type Props = {
  open: boolean;
  onClose: () => void;

  // PNG (si lo necesitas)
  onSavePng?: (payload: { dataUrl: string; blob: Blob; width: number; height: number }) => void;

  // SVG (vector)
  onSaveSvg?: (payload: { svg: string; blob: Blob }) => void;

  title?: string;
  initialPngDataUrl?: string | null; // opcional: re-cargar un png previo
  autoFullscreen?: boolean;
};

type Point = { x: number; y: number; p?: number; t?: number };

type Stroke = {
  id: string;
  color: string;
  width: number; // en unidades “screen px” antes de zoom
  points: Point[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Convierte un stroke a path SVG simple con Q curves (suavizado básico).
 */
function strokeToSvgPath(stroke: Stroke) {
  const pts = stroke.points;
  if (!pts.length) return '';
  if (pts.length === 1) {
    const p = pts[0];
    return `M ${p.x} ${p.y} L ${p.x + 0.01} ${p.y + 0.01}`;
  }
  // Smooth: usar puntos medios
  const mid = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  let d = '';
  const p0 = pts[0];
  d += `M ${p0.x} ${p0.y} `;
  for (let i = 1; i < pts.length - 1; i++) {
    const m = mid(pts[i], pts[i + 1]);
    d += `Q ${pts[i].x} ${pts[i].y} ${m.x} ${m.y} `;
  }
  const last = pts[pts.length - 1];
  d += `L ${last.x} ${last.y}`;
  return d;
}

/**
 * Transform helpers:
 * - “world” = coordenadas reales del documento/dibujo
 * - “screen” = coordenadas en pixeles visibles del canvas
 * scale/translate permiten zoom/pan.
 */
function screenToWorld(x: number, y: number, tx: number, ty: number, scale: number) {
  return { x: (x - tx) / scale, y: (y - ty) / scale };
}
function worldToScreen(x: number, y: number, tx: number, ty: number, scale: number) {
  return { x: x * scale + tx, y: y * scale + ty };
}

export function FullscreenHandwritingPad({
  open,
  onClose,
  onSavePng,
  onSaveSvg,
  title = 'Nota a mano alzada',
  initialPngDataUrl = null,
  autoFullscreen = true,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const dpr = useMemo(() => (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1), []);

  // draw state
  const [penSize, setPenSize] = useState(4);
  const [penColor, setPenColor] = useState('#111827');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isFs, setIsFs] = useState(false);

  // zoom/pan
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);
  const [tx, setTx] = useState(0); // translateX screen space
  const [ty, setTy] = useState(0);
  const txRef = useRef(0);
  const tyRef = useRef(0);

  // strokes (vector)
  const strokesRef = useRef<Stroke[]>([]);
  const redoSnapshotRef = useRef<Stroke[][]>([]);

  // pointer tracking
  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const lastScreenRef = useRef<{ x: number; y: number } | null>(null);

  // for pinch zoom
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ dist: number; center: { x: number; y: number }; startScale: number; startTx: number; startTy: number } | null>(null);

  const penColorRef = useRef(penColor);
  const penSizeRef = useRef(penSize);

  useEffect(() => { penColorRef.current = penColor; }, [penColor]);
  useEffect(() => { penSizeRef.current = penSize; }, [penSize]);

  const closingRef = useRef(false);

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;

    const fsEl = (document as any).fullscreenElement || (document as any).webkitFullscreenElement;
    if (fsEl) {
      // salir de fullscreen; el cierre lo hacemos en fullscreenchange
      exitFullscreen();
    } else {
      onClose();
    }
  };

  // ----- Fullscreen helpers
  const enterFullscreen = async () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      // @ts-ignore
      await (el.requestFullscreen?.() || (el as any).webkitRequestFullscreen?.());
    } catch {}
  };

  const exitFullscreen = async () => {
    try {
      // @ts-ignore
      await (document.exitFullscreen?.() || (document as any).webkitExitFullscreen?.());
    } catch {}
  };

  // ----- Canvas sizing
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));

    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;

    redraw();
  };

  // ----- Redraw from vector strokes + background
  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    // Clear full pixel buffer
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background (full canvas)
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transform for strokes: we draw in “world coords” scaled to screen
    // Our world coords are in "CSS px" units; we map to device px by dpr.
    const currentScale = scaleRef.current;
    const currentTx = txRef.current;
    const currentTy = tyRef.current;

    // Transform order:
    // device pixels:
    // 1) scale by dpr (css->device)
    // 2) then apply zoom scale and translate in css space * dpr
    ctx.setTransform(dpr * currentScale, 0, 0, dpr * currentScale, dpr * currentTx, dpr * currentTy);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const strokes = strokesRef.current;
    for (const s of strokes) {
      if (!s.points.length) continue;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
    }

    ctx.restore();
  };

  // ----- Undo/Clear
  const pushSnapshot = () => {
    // Guardar una copia de strokes (vector) para undo
    redoSnapshotRef.current = []; // limpia redo stack si tuvieras
    strokesRef.current = [...strokesRef.current]; // fuerza nueva referencia
  };

  const undo = () => {
    const arr = strokesRef.current;
    if (!arr.length) return;
    arr.pop();
    redraw();
  };

  const clear = () => {
    strokesRef.current = [];
    redraw();
  };

  // ----- Load initial PNG (raster) to strokes? (No; lo renderizamos como fondo “imagen” sería otro feature)
  // Para simplicidad: si te interesa re-editar PNG como raster, se puede en otra iteración.
  const loadInitialPng = async () => {
    if (!initialPngDataUrl) return;
    // Renderizar PNG en canvas como “stroke raster” no se guarda en SVG.
    // En este build lo dibujamos directo al canvas y se queda, pero no entra en strokes.
    // Si lo quieres editable como imagen, lo hacemos con una layer adicional.
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const img = new Image();
    img.src = initialPngDataUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    // Dibuja el png como background raster ya transformado por zoom? Lo fijamos a screen:
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  };

  // ----- Pointer handlers
  const getScreenPoint = (e: PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left), y: (e.clientY - rect.top), p: e.pressure || 0 };
  };

  const startStroke = (worldX: number, worldY: number, pressure: number) => {
    const color = penColorRef.current;
    const size = penSizeRef.current;

    const s: Stroke = {
      id: uid(),
      color,
      width: clamp(size * (pressure ? (0.7 + pressure * 1.3) : 1), 1, 40),
      points: [{ x: worldX, y: worldY, p: pressure, t: Date.now() }],
    };

    activeStrokeRef.current = s;
    strokesRef.current.push(s);
  };

  const addPointToStroke = (worldX: number, worldY: number, pressure: number) => {
    const s = activeStrokeRef.current;
    if (!s) return;
    // agregar punto si cambia lo suficiente (reduce ruido)
    const last = s.points[s.points.length - 1];
    const dx = worldX - last.x;
    const dy = worldY - last.y;
    if (dx * dx + dy * dy < 0.5) return;
    s.points.push({ x: worldX, y: worldY, p: pressure, t: Date.now() });
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    // multi-touch => pinch
    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx, dy);
      const center = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      pinchRef.current = {
        dist,
        center,
        startScale: scaleRef.current,
        startTx: txRef.current,
        startTy: tyRef.current,
      };
      isDrawingRef.current = false;
      isPanningRef.current = true;
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      return;
    }

    // Space + drag => pan (desktop)
    if ((window as any).__handPadSpaceDown === true) {
      isPanningRef.current = true;
      lastScreenRef.current = { x: e.clientX, y: e.clientY };
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      return;
    }

    // draw
    pushSnapshot();
    isDrawingRef.current = true;
    isPanningRef.current = false;

    const sp = getScreenPoint(e);
    const world = screenToWorld(sp.x, sp.y, txRef.current, tyRef.current, scaleRef.current);
    startStroke(world.x, world.y, sp.p);

    try { canvas.setPointerCapture(e.pointerId); } catch {}
    redraw();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // track pointers
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // pinch zoom
    if (pointersRef.current.size === 2 && pinchRef.current) {
      e.preventDefault();
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx, dy);

      const pr = pinchRef.current;
      const factor = dist / (pr.dist || 1);
      const nextScale = clamp(pr.startScale * factor, 0.5, 4);

      // mantener centro estable
      const canvasRect = canvas.getBoundingClientRect();
      const cx = pr.center.x - canvasRect.left;
      const cy = pr.center.y - canvasRect.top;

      // world center antes
      const worldCenterBefore = screenToWorld(cx, cy, pr.startTx, pr.startTy, pr.startScale);

      // calcular nuevos tx/ty para que worldCenter permanezca en el mismo screen point
      const nextTx = cx - worldCenterBefore.x * nextScale;
      const nextTy = cy - worldCenterBefore.y * nextScale;

      scaleRef.current = nextScale;
      txRef.current = nextTx;
      tyRef.current = nextTy;

      setScale(nextScale);
      setTx(nextTx);
      setTy(nextTy);

      redraw();
      return;
    }

    // pan
    if (isPanningRef.current) {
      e.preventDefault();
      const last = lastScreenRef.current;
      if (!last) {
        lastScreenRef.current = { x: e.clientX, y: e.clientY };
        return;
      }
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;

      const nextTx = txRef.current + dx;
      const nextTy = tyRef.current + dy;

      txRef.current = nextTx;
      tyRef.current = nextTy;
      setTx(nextTx);
      setTy(nextTy);

      lastScreenRef.current = { x: e.clientX, y: e.clientY };
      redraw();
      return;
    }

    // draw move
    if (!isDrawingRef.current) return;
    e.preventDefault();

    const sp = getScreenPoint(e);
    const world = screenToWorld(sp.x, sp.y, txRef.current, tyRef.current, scaleRef.current);
    addPointToStroke(world.x, world.y, sp.p);
    redraw();
  };

  const endPointer = (e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.delete(e.pointerId);
    }
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }

    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      activeStrokeRef.current = null;
    }

    if (isPanningRef.current) {
      isPanningRef.current = false;
      lastScreenRef.current = null;
    }

    try { canvas.releasePointerCapture(e.pointerId); } catch {}
  };

  const onPointerUp = (e: PointerEvent) => {
    e.preventDefault();
    endPointer(e);
  };
  const onPointerCancel = (e: PointerEvent) => {
    e.preventDefault();
    endPointer(e);
  };

  // ----- Mouse wheel zoom (trackpad pinch also triggers wheel on many browsers)
  const onWheel = (e: WheelEvent) => {
    if (!open) return;
    // Ctrl+wheel suele ser pinch on trackpad en Chrome
    const canvas = canvasRef.current;
    if (!canvas) return;

    // zoom when ctrlKey or trackpad pinch (often ctrlKey true)
    const zoomIntent = e.ctrlKey || Math.abs(e.deltaY) < 50;
    if (!zoomIntent) return;

    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const prevScale = scaleRef.current;
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.08 : 0.92;
    const nextScale = clamp(prevScale * factor, 0.5, 4);

    // mantener el punto bajo el cursor
    const worldBefore = screenToWorld(sx, sy, txRef.current, tyRef.current, prevScale);
    const nextTx = sx - worldBefore.x * nextScale;
    const nextTy = sy - worldBefore.y * nextScale;

    scaleRef.current = nextScale;
    txRef.current = nextTx;
    tyRef.current = nextTy;

    setScale(nextScale);
    setTx(nextTx);
    setTy(nextTy);

    redraw();
  };

  // ----- Export PNG/SVG
  const exportPng = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSavePng) return;

    const dataUrl = canvas.toDataURL('image/png');
    const blob: Blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b as Blob), 'image/png');
    });

    onSavePng({ dataUrl, blob, width: canvas.width, height: canvas.height });
  };

  const exportSvg = async () => {
    if (!onSaveSvg) return;

    // SVG en “world coordinates” (sin zoom/pan)
    // Tomamos tamaño del viewport en world según canvas wrap
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);

    const strokes = strokesRef.current;

    const paths = strokes
      .map((s) => {
        const d = strokeToSvgPath(s);
        if (!d) return '';
        return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round" />`;
      })
      .filter(Boolean)
      .join('\n');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect x="0" y="0" width="${w}" height="${h}" fill="${bgColor}" />
  ${paths}
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    onSaveSvg({ svg, blob });
  };

  // ----- Lifecycle open/close
  useEffect(() => {
    if (!open) return;
    closingRef.current = false;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Reset transform on open (optional)
    scaleRef.current = 1;
    txRef.current = 0;
    tyRef.current = 0;
    setScale(1);
    setTx(0);
    setTy(0);

    // resize + handlers
    const onResize = () => resizeCanvas();
    window.addEventListener('resize', onResize);

    // ESC: cerrar modal (y salir de fullscreen si aplica)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        requestClose();
      }
      if (e.code === 'Space') (window as any).__handPadSpaceDown = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        (window as any).__handPadSpaceDown = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // fullscreenchange tracking
    const onFsChange = () => {
      const fsEl = (document as any).fullscreenElement || (document as any).webkitFullscreenElement;
      setIsFs(!!fsEl);

      // si estábamos cerrando y ya no hay fullscreen => cerrar modal
      if (!fsEl && closingRef.current) {
        onClose();
        return;
      }

      // si no estamos cerrando, solo resize/redraw normal
      setTimeout(() => resizeCanvas(), 50);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange as any);

    // canvas listeners
    const canvas = canvasRef.current!;
    canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
    canvas.addEventListener('pointermove', onPointerMove, { passive: false });
    canvas.addEventListener('pointerup', onPointerUp, { passive: false });
    canvas.addEventListener('pointercancel', onPointerCancel, { passive: false });

    // wheel zoom
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // init
    setTimeout(() => {
      resizeCanvas();
      redraw();
      loadInitialPng();
    }, 0);

    // Fullscreen: en muchos browsers solo funciona si fue por gesto del usuario.
    // Aun así, intentamos.
    if (autoFullscreen) {
      setTimeout(() => enterFullscreen(), 0);
    }

    return () => {
      document.body.style.overflow = prevOverflow;

      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);

      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange as any);

      canvas.removeEventListener('pointerdown', onPointerDown as any);
      canvas.removeEventListener('pointermove', onPointerMove as any);
      canvas.removeEventListener('pointerup', onPointerUp as any);
      canvas.removeEventListener('pointercancel', onPointerCancel as any);
      canvas.removeEventListener('wheel', onWheel as any);

      (window as any).__handPadSpaceDown = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // When bgColor changes: repaint background WITHOUT deleting strokes (redraw handles it)
  useEffect(() => {
    if (!open) return;
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgColor]);

  // When transform changes: redraw
  useEffect(() => {
    if (!open) return;
    scaleRef.current = scale;
    txRef.current = tx;
    tyRef.current = ty;
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, tx, ty]);

  if (!open) return null;

  return (
    <div ref={rootRef} className="fixed inset-0 z-[9999] bg-white">
      {/* Top bar */}
      <div className="h-14 bg-white/90 backdrop-blur border-b border-gray-200 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={requestClose}
            className="h-10 w-10 rounded-md hover:bg-gray-100 flex items-center justify-center"
            title="Cerrar (Esc)"
          >
            <XMarkIcon className="h-6 w-6 text-gray-700" />
          </button>
          <div className="font-medium text-gray-900">{title}</div>
          <div className="ml-3 text-xs text-gray-500 hidden md:block">
            Zoom: pinch/ctrl+scroll • Pan: Space + arrastrar • Undo: botón
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (isFs ? exitFullscreen() : enterFullscreen())}
            className="h-10 px-3 rounded-md border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
            title="Pantalla completa"
          >
            {isFs ? (
              <>
                <ArrowsPointingInIcon className="h-5 w-5 text-gray-700" />
                <span className="text-sm">Salir</span>
              </>
            ) : (
              <>
                <ArrowsPointingOutIcon className="h-5 w-5 text-gray-700" />
                <span className="text-sm">Fullscreen</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={undo}
            className="h-10 px-3 rounded-md border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
          >
            <ArrowUturnLeftIcon className="h-5 w-5 text-gray-700" />
            <span className="text-sm">Deshacer</span>
          </button>

          <button
            type="button"
            onClick={clear}
            className="h-10 px-3 rounded-md border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
          >
            <TrashIcon className="h-5 w-5 text-gray-700" />
            <span className="text-sm">Limpiar</span>
          </button>

          {/* Export */}
          <div className="flex items-center gap-2">
            {onSavePng && (
              <button
                type="button"
                onClick={exportPng}
                className="h-10 px-3 rounded-md bg-primary-600 text-white hover:bg-primary-700 text-sm font-medium flex items-center gap-2"
                title="Guardar como PNG"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                PNG
              </button>
            )}
            {onSaveSvg && (
              <button
                type="button"
                onClick={exportSvg}
                className="h-10 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
                title="Guardar como SVG"
              >
                <ArrowDownTrayIcon className="h-5 w-5 text-gray-700" />
                SVG
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="h-12 bg-white/80 backdrop-blur border-b border-gray-200 flex items-center gap-4 px-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Grosor</span>
          <input
            type="range"
            min={1}
            max={18}
            value={penSize}
            onChange={(e) => setPenSize(parseInt(e.target.value, 10))}
          />
          <span className="text-xs text-gray-600 w-6 text-right">{penSize}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Pluma</span>
          <input
            type="color"
            value={penColor}
            onChange={(e) => setPenColor(e.target.value)}
            className="h-7 w-10 p-0 border border-gray-200 rounded"
            title="Color de pluma"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Fondo</span>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-7 w-10 p-0 border border-gray-200 rounded"
            title="Color de fondo"
          />
          <span className="text-xs text-gray-500 hidden md:inline">
            (cambia sin borrar)
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs text-gray-600">
          <span>Zoom: {Math.round(scale * 100)}%</span>
          <button
            type="button"
            className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
            onClick={() => {
              scaleRef.current = 1; txRef.current = 0; tyRef.current = 0;
              setScale(1); setTx(0); setTy(0);
              redraw();
            }}
            title="Reset zoom"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={wrapRef} className="absolute left-0 right-0 bottom-0 top-[104px] bg-white">
        <canvas
          ref={canvasRef}
          style={{
            touchAction: 'none',
            display: 'block',
            width: '100%',
            height: '100%',
            cursor: (typeof window !== 'undefined' && (window as any).__handPadSpaceDown) ? 'grab' : 'crosshair',
          }}
        />
      </div>
    </div>
  );
}

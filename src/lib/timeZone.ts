import { api } from '../services/api';

export interface SystemConfig {
  timeZone: string;
  serverNow: string;
  utcOffsetMinutes: number;
}

let cached: SystemConfig | null = null;
let fetchedAt = 0;
let inflight: Promise<SystemConfig | null> | null = null;

/**
 * Carga (una sola vez) la configuracion del sistema desde GET /api/Config:
 * zona horaria activa (TZ) y hora del servidor. Devuelve null si falla.
 */
export function loadSystemConfig(): Promise<SystemConfig | null> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = api
      .get<SystemConfig>('/api/Config')
      .then((r) => {
        const d = r.data;
        if (d && typeof d.serverNow === 'string' && d.serverNow.length >= 19) {
          cached = d;
          fetchedAt = Date.now();
          return cached;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function getSystemConfig(): SystemConfig | null {
  return cached;
}

/** Zona horaria configurada en el backend (TZ). Fallback: America/Caracas. */
export function systemTimeZone(): string {
  return cached?.timeZone || 'America/Caracas';
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * "Ahora" como hora pared del servidor en formato yyyy-MM-ddTHH:mm:ss (naive, sin Z).
 * Usa el reloj del servidor; si aun no hay configuracion, cae a la hora local del navegador.
 */
export function nowWall(): string {
  if (cached) {
    const base = Date.parse(`${cached.serverNow}Z`);
    if (!isNaN(base)) {
      const d = new Date(base + (Date.now() - fetchedAt));
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    }
  }
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** "Ahora" del servidor recortado al minuto: yyyy-MM-ddTHH:mm. */
export function nowWallMinute(): string {
  return nowWall().slice(0, 16);
}

/** Fecha (solo) del servidor: yyyy-MM-dd. */
export function todayWall(): string {
  return nowWall().slice(0, 10);
}

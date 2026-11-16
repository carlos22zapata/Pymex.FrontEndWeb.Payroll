# AGENTS.md — Pymex.FrontEndWeb.Payroll (Frontend Nómina)

SPA React 19 para la gestión de Nómina del sistema Pymex/ToolTips.

## Punto de partida

| Recurso | Qué contiene | Cómo acceder |
|---|---|---|
| `AGENTS.md` (solución) | Guía general del ecosistema Pymex | auto |
| `@docs` | Documentación técnica de este proyecto | `@docs` |
| `@docs-shared` | Documentación general del ecosistema | `@docs-shared` |
| `@memory` | Log de funcionalidad implementada | `@memory` |
| Skills compartidos | Convenciones frontend, diseño UI, domain knowledge | `skill(frontend-conventions)`, `skill(ui-design-system)`, `skill(domain-knowledge)` |

## Stack

- React 19 + TypeScript 6 + Vite 8
- Tailwind CSS 4, Lucide React (iconos)
- React Router 7, Axios, React Hot Toast
- Puerto **7300** (dev server)

## Autenticación

- Login externo en `Pymex.FrontEndWeb.Auth` (puerto 7200)
- Redirección con tokens en URL hash: `#access_token=...&refresh_token=...&user=...&enterprise=...`
- `AuthContext` parsea hash → localStorage → limpia URL
- `ProtectedRoute` redirige al Auth si no hay sesión
- Header `ConexName` en requests al backend

## Rutas

| Ruta | Página |
|------|--------|
| `/dashboard` | Dashboard principal |
| `/departamentos` | Gestión de departamentos |
| `/cargos` | Gestión de cargos |
| `/empleados` | Gestión de empleados |
| `/contratos` | Gestión de contratos |
| `/variables-nomina` | Variables de nómina |
| `/conceptos-nomina` | Conceptos/fórmulas de nómina |
| `/calcular-nomina` | Cálculo y cierre de nómina |
| `/monedas` | Catálogo de monedas |
| `/tasa-monedas` | Cotizaciones de monedas |

## Convenciones

- Alertas con `react-hot-toast` (toastSuccess, toastError)
- Servicios HTTP en `src/services/` con `ApiResult<T>`
- DTOs en `src/types/`
- Componentes reutilizables en `src/components/`
- Constantes (API URLs, storage keys) en `src/lib/constants.ts`
- Contextos para estado global en `src/context/`

## Comandos

- Dev: `npm run dev` (puerto 7300)
- Build: `npm run build` (tsc + vite build)
- Preview: `npm run preview`

## Estructura

```
src/
├── App.tsx              # Rutas
├── main.tsx             # Entry point
├── context/             # AuthContext, ThemeContext
├── hooks/               # useAuth
├── pages/               # Páginas (Dashboard, Employees, etc.)
├── components/          # Componentes reutilizables
├── services/            # API services (axios)
├── types/               # DTOs e interfaces
└── lib/                 # Constants, utilidades
```

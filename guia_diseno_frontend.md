# Guía de Diseño y Apariencia — Pymex FrontEndWeb

> Documento orientativo para replicar el diseño del sistema ToolTips/Pymex en un nuevo proyecto.

---

## 1. Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 19.x | Framework UI |
| TypeScript | 6.x | Tipado estático |
| Vite | 8.x | Bundler / dev server |
| Tailwind CSS | 4.x | Estilos utilitarios |
| Lucide React | 1.x | Iconos |
| React Router DOM | 7.x | Enrutamiento |
| React Hot Toast | 2.x | Notificaciones toast |
| Axios | 1.x | HTTP client |

---

## 2. Layout General

### 2.1 Estructura de la Pantalla

La aplicación tiene un layout fijo que consta de:

```
┌──────────────────────────────────────────────┐
│  Sidebar (fijo, w-64 o w-16 colapsado)       │
│  ┌──────────┐ ┌────────────────────────────┐  │
│  │          │ │  Main Content              │  │
│  │  Logo    │ │  ┌─────────────────────┐   │  │
│  │          │ │  │  Header (sticky)    │   │  │
│  │  Nav     │ │  │  - Título           │   │  │
│  │  Sections│ │  │  - OptionsBar       │   │  │
│  │          │ │  │  - Search input     │   │  │
│  │  Theme   │ │  ├─────────────────────┤   │  │
│  │  User    │ │  │  Form / Content     │   │  │
│  │  Logout  │ │  │  (stat-card)        │   │  │
│  │          │ │  │                     │   │  │
│  └──────────┘ │  └─────────────────────┘   │  │
│               │                             │  │
└───────────────┴─────────────────────────────┘
```

**Componentes involucrados:**
- `Layout.tsx` — contenedor flex con sidebar + main, maneja el menú responsive en móvil.
- `Sidebar.tsx` — navegación agrupada por secciones.
- `OptionsBar.tsx` — barra de herramientas superior.

### 2.2 Layout.tsx

📄 `src/components/Layout.tsx`

- El sidebar y el main están en un `flex` horizontal con `h-screen overflow-hidden`.
- Fondo: `bg-gray-50 dark:bg-gray-950`.
- En **móvil** (`lg:hidden`):
  - Barra superior fija con logo + botón hamburguesa.
  - Backdrop semitransparente (`bg-black/40`) al abrir menú.
  - Sidebar se desliza desde la izquierda con `translate-x`.
- En **escritorio** (`lg:static`): sidebar siempre visible.

---

## 3. Sidebar (Menú Lateral)

📄 `src/components/Sidebar.tsx`

### 3.1 Comportamiento

- **Colapsable**: ancho `w-64` expandido, `w-16` colapsado. Animación `transition-all duration-300`.
- **Transición suave** en todos los cambios de estado.
- Secciones de navegación agrupadas por título.

### 3.2 Estructura de Navegación

```typescript
const navSections: NavSection[] = [
  {
    title: 'Dashboard',
    items: [{ label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }],
  },
  {
    title: 'Ventas',
    items: [
      { label: 'Clientes', icon: Users, path: '/clientes' },
      { label: 'Cotizaciones', icon: FileText, path: '/cotizaciones' },
      { label: 'Facturas', icon: FileText, path: '/facturas' },
      { label: 'Devoluciones', icon: RotateCcw, path: '/devoluciones' },
      { label: 'Cobros', icon: Banknote, path: '/cobros' },
    ],
  },
  // ... Compras, Inventario, Finanzas, Tablas Maestras, Configuración
];
```

### 3.3 Elementos del Sidebar (de arriba a abajo)

1. **Logo** — Imagen + nombre "ToolTips" (oculta en colapsado, solo ícono).
2. **Botón colapsar** — `ChevronLeft` / `ChevronRight`.
3. **Enterprise badge** — Nombre de la empresa activa con label "Empresa activa".
4. **Navegación** — Scroll interno (`overflow-y-auto`), separación `space-y-5` entre secciones.
5. **Theme Toggle** — Botón para cambiar modo oscuro/claro.
6. **Información de usuario** — Nombre + rol.
7. **Cerrar sesión** — Botón en color `rose-600`.

### 3.4 Estilos de los Links

**CSS classes en `index.css`:**

```css
.sidebar-link {
  @apply flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl
         transition-all duration-200 cursor-pointer;
}

.sidebar-link-active {
  @apply bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300;
}

.sidebar-link-inactive {
  @apply text-gray-600 hover:bg-gray-100 hover:text-gray-900
         dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200;
}
```

### 3.5 Responsive

- En móvil el sidebar se oculta (`-translate-x-full`) y se muestra con el botón hamburguesa.
- Backdrop `bg-black/40` al abrir.
- El sidebar usa `fixed inset-y-0 left-0 z-40` en móvil, `lg:static lg:z-auto` en escritorio.

---

## 4. Modo Oscuro / Claro

📄 `src/context/ThemeContext.tsx`

### 4.1 Implementación

- Usa Tailwind CSS con la variante `dark:` (activada cuando el `<html>` tiene clase `.dark`).
- El estado se persiste en `localStorage` con clave `pymex_theme`.
- También respeta `pymex_appearance` (sincronizado con el perfil del usuario).
- Se provee como contexto React: `ThemeProvider` expone `{ theme, toggleTheme, setTheme }`.
- Escucha cambios en `localStorage` de otros tabs mediante `StorageEvent`.

### 4.2 Uso

```tsx
const { theme, toggleTheme } = useTheme();
// theme: 'light' | 'dark'
```

### 4.3 Paleta de Colores

| Elemento | Light | Dark |
|----------|-------|------|
| Fondo body | `bg-gray-50` | `dark:bg-gray-950` |
| Sidebar | `bg-white` | `dark:bg-gray-900` |
| Borde sidebar | `border-gray-200` | `dark:border-gray-800` |
| Texto principal | `text-gray-900` | `dark:text-white` |
| Texto secundario | `text-gray-500` | `dark:text-gray-400` |
| Inputs | `bg-white/50 border-gray-200` | `dark:bg-gray-800/50 dark:border-gray-700` |
| Cards | `bg-white/80` | `dark:bg-gray-800/80` |
| Link activo nav | `bg-indigo-50 text-indigo-700` | `dark:bg-indigo-900/40 dark:text-indigo-300` |
| Botón primario | `from-indigo-600 to-violet-600` | (mismo gradiente) |
| Modal overlay | `bg-black/40` | `dark:bg-black/60` |
| Modal content | `bg-white` | `dark:bg-gray-800` |
| Badge rojo | `bg-red-100 text-red-700` | `dark:bg-red-900/40 dark:text-red-300` |

### 4.4 Theme Toggle

📄 `src/components/ThemeToggle.tsx`

- Ubicado en el sidebar, antes del cierre de sesión.
- Muestra ícono `Moon` si está en claro, `Sun` si está en oscuro.
- Label: "Modo oscuro" / "Modo claro" (oculto en sidebar colapsado).
- Usa la clase `sidebar-link` para mantener consistencia visual.

---

## 5. Barra Superior (Header + OptionsBar)

📄 `src/components/OptionsBar.tsx`

### 5.1 Componentes

Cada página renderiza un header **sticky** con:

```tsx
<div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
  <div className="px-4 sm:px-6 lg:px-8 py-2 max-w-6xl mx-auto">
    <div className="flex items-center gap-3">
      <button onClick={() => navigate('/dashboard')}>  // ← flecha volver
        <ArrowLeft />
      </button>
      <div className="flex-1">
        <h1 className="text-lg font-bold">Título</h1>
        <p className="text-xs text-gray-500">Subtítulo</p>
      </div>
      <OptionsBar ... />
      <input type="text" placeholder="Presione F2 para buscar..." className="input-field" />
    </div>
  </div>
</div>
```

### 5.2 Opciones de OptionsBar

Botones disponibles (todos opcionales mediante props):

| Prop | Icono | Tooltip | Descripción |
|------|-------|---------|-------------|
| `showNav` + `onFirst/onPrev/onNext/onLast` | `ChevronsLeft` `ChevronLeft` `ChevronRight` `ChevronsRight` | Navegación de registros | Primer, anterior, siguiente, último |
| `onNew` | `Plus` | Nuevo registro | Limpia el formulario |
| `onSave` | `Save` | Guardar registro | Muestra spinner `Loader2` cuando `isSaving=true` |
| `onDelete` | `Trash2` | Borrar registro | Deshabilitado si `canDelete=false` |
| `onSearch` | `Search` | Opción de búsqueda | Dispara búsqueda |
| `onCancel` | `Ban` | Anular registro | Para anular documentos |
| `onPrint` | `Printer` | Imprimir | Imprimir documento |

### 5.3 Estilos de OptionsBar

```css
/* Cada botón */
flex h-12 w-12 items-center justify-center rounded-xl
bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800
text-indigo-600 dark:text-indigo-400
hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600
disabled:opacity-40 disabled:cursor-not-allowed
transition-colors shadow-sm
```

### 5.4 Navegación de Registros

- `onFirst` → va al primer registro (navPositionId=0).
- `onPrevious` → registro anterior (navPositionId=1).
- `onNext` → registro siguiente (navPositionId=2).
- `onLast` → último registro (navPositionId=3).
- Se implementa mediante `getNavBarById(navPositionId, idReference)` del backend.

---

## 6. Inputs y Campos Numéricos / Decimales

📄 `src/components/DecimalInput.tsx`

### 6.1 Comportamiento

```tsx
interface DecimalInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}
```

### 6.2 Formato Dinámico desde Base de Datos

El formato se obtiene de la tabla `Settings`:

```typescript
const decimalSep = settings?.decimalSeparator ?? '.';        // "." o ","
const thousandsSep = settings?.thousandsSeparator ?? ',';    // "," o "."
const decimals = settings?.decimals ?? 2;                    // 2, 4, 6...
```

### 6.3 Formateo y Parseo

**Al perder foco (blur):** el valor se muestra formateado:
```
1234567.89  →  "1.234.567,89"  (si decimalSep="," y thousandsSep=".")
```

**Durante edición (focus):** el usuario escribe libremente, pero se filtran caracteres no numéricos:
```typescript
const sanitized = raw.replace(new RegExp(`[^0-9\\${decimalSep}]`, 'g'), '');
```

**Al recibir valores desde el backend:** se formatean automáticamente con `toFixed(decimals)`.

### 6.4 Integración con Inputs

```tsx
<DecimalInput
  value={item.quantity}
  onChange={(v) => handleFieldChange('quantity', v)}
  className="input-field text-right font-medium"
  placeholder="0.00"
/>
```

### 6.5 Estilos de Input (input-field)

📄 `src/index.css`

```css
.input-field {
  @apply w-full px-4 py-2 bg-white/50 border border-gray-200 rounded-xl
         text-gray-700 placeholder-gray-400
         focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500
         transition-all duration-200
         dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-200
         dark:placeholder-gray-500 dark:focus:ring-indigo-500/60 dark:focus:border-indigo-400;
}
```

---

## 7. Botones

### 7.1 Botón Primario

```css
.btn-primary {
  @apply w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-violet-600
         text-white font-semibold rounded-xl
         hover:from-indigo-700 hover:to-violet-700
         focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2
         disabled:opacity-50 disabled:cursor-not-allowed
         transition-all duration-200 shadow-lg shadow-indigo-500/25;
}
```

### 7.2 Botón Secundario

```css
.btn-secondary {
  @apply px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl
         hover:bg-gray-50 hover:border-gray-300
         focus:outline-none focus:ring-2 focus:ring-gray-200
         transition-all duration-200
         dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300
         dark:hover:bg-gray-700/50 dark:hover:border-gray-600;
}
```

### 7.3 Botones Pequeños en Modales

- **Botón verde de acción** (ej. "Buscar" en SearchModal): `bg-emerald-600 text-white hover:bg-emerald-700`
- **Botón "Cancelar"**: `text-gray-700 hover:bg-gray-200`
- **Botón "Guardar"**: `bg-indigo-600 text-white hover:bg-indigo-700`

---

## 8. Formularios Modales

📄 Ejemplos: `SearchModal.tsx`, `PriceModal.tsx`, `PaymentModal.tsx`

### 8.1 Estructura General

```tsx
{open && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Backdrop */}
    <div className="fixed inset-0 bg-black/50" onClick={onClose} />

    {/* Content */}
    <div className="relative w-full max-w-md bg-white dark:bg-gray-900
                    rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700
                    overflow-hidden flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl
                          bg-XXX-50 dark:bg-XXX-900/30 text-XXX-600">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Título</h3>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400
                        hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800
                        dark:hover:text-gray-300 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body (scrollable) */}
      <div className="p-5 overflow-y-auto space-y-5">
        {/* ... contenido del formulario ... */}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-100
                      dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 shrink-0">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium
                        text-gray-700 dark:text-gray-300 hover:bg-gray-200
                        dark:hover:bg-gray-700 transition-colors">Cancelar</button>
        <button onClick={handleSave} className="px-4 py-2 rounded-xl
                        bg-indigo-600 text-white hover:bg-indigo-700 transition-colors
                        text-sm font-medium">Guardar</button>
      </div>
    </div>
  </div>
)}
```

### 8.2 Atajos de Teclado

```typescript
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'Escape') onClose();
  }
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [open, onClose]);
```

### 8.3 SearchModal

📄 `src/components/SearchModal.tsx`

- **Props**: `open`, `title`, `records`, `isSearching`, `hasMore`, `onSearch`, `onLoadMore`, `onSelect`, `onClose`.
- **Funcionalidad**:
  - Campo de texto con filtro + botón de búsqueda verde.
  - Lista de resultados con ícono, nombre, código y ID.
  - Carga infinita (`IntersectionObserver` para detectar scroll al final).
  - Soporte para columnas personalizadas (`columns` prop).
  - Tecla `Escape` para cerrar, `Enter` para buscar.

---

## 9. Toggle / Switch

📄 `src/components/Toggle.tsx`

```tsx
<Toggle
  id="isCustomer"
  checked={entity.isCustomer}
  onChange={(e) => handleFieldChange('isCustomer', e.target.checked)}
  label="Es cliente"
/>
```

**Estructura:** input `checkbox` oculto (`.sr-only`), el toggle visual se compone de:
- Track: `h-6 w-10 rounded-full`, gris cuando off, `bg-indigo-600` cuando on.
- Thumb: `h-5 w-5 rounded-full bg-white`, se desliza con `peer-checked:translate-x-4`.
- Animación `transition-colors duration-200` y `transition-transform duration-200`.

---

## 10. Paginación

📄 `src/components/Pagination.tsx`

```tsx
interface PaginationProps {
  page: number;
  recordsPerPage: number;
  onPageChange: (page: number) => void;
  onRecordsPerPageChange: (records: number) => void;
}
```

- Botones: `ChevronsLeft` (primera), `ChevronLeft` (anterior), indicador "Página **N**", `ChevronRight` (siguiente), `ChevronsRight` (última +10).
- Selector de registros por página (10, 20, 50, 100).
- Estilo: botones `h-8 w-8` con borde, hover indigo.

---

## 11. EstatCards

📄 `src/components/StatCard.tsx` (para Dashboard)

```css
.stat-card {
  @apply bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl
         rounded-2xl p-6 hover:shadow-2xl transition-all duration-300
         dark:bg-gray-800/80 dark:border-gray-700/30 dark:shadow-gray-900/50
         dark:hover:shadow-indigo-900/20;
}
```

---

## 12. Animaciones

```css
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}
```

---

## 13. Sistema de Autenticación (Login Externo)

📄 `src/services/api.ts`, `src/context/AuthContext.tsx`, `src/components/ProtectedRoute.tsx`

### 13.1 Flujo

```
1. Usuario va a http://localhost:7200 (otra app de login)
2. Login app redirige de vuelta con hash:
   http://localhost:5173/#access_token=...&refresh_token=...&user=...&enterprise=...
3. AuthContext detecta el hash en window.location,
   guarda tokens en localStorage, limpia el hash.
4. ProtectedRoute verifica tokens y muestra la app.
```

### 13.2 Axios Interceptor

📄 `src/services/api.ts`

```typescript
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Empresa activa → header ConexName
  return config;
});
```

### 13.3 Refresh Token Automático

- Si una petición recibe `401`:
  1. Si ya hay un refresh en curso, encola la petición.
  2. Si no, envía `POST /api/Access/RefreshToken` con el `refreshToken`.
  3. Si ok: guarda nuevo token + refreshToken, reintenta la petición.
  4. Si falla: limpia tokens, redirige al login.
- Maneja cola de peticiones simultáneas que esperan el refresh.

### 13.4 Carga Inicial

`ProtectedRoute` muestra un spinner centrado mientras `isLoading` es `true`.
Si no está autenticado, redirige a `http://localhost:7200`.

---

## 14. Tipografía

- **Font family**: `'Inter', system-ui, -apple-system, sans-serif`
- **Clases comunes**:
  - `text-xs` (tamaño 12px): subtítulos, metadatos.
  - `text-sm` (14px): labels, descripciones.
  - `text-sm font-medium`: labels de formulario.
  - `text-lg font-bold`: títulos de página.
  - `text-[11px] font-semibold uppercase tracking-wider`: títulos de sección en sidebar.
- **Texto monoespaciado**: `font-mono` para IDs.

---

## 15. Iconos

- Todos los iconos vienen de **Lucide React** (`lucide-react`).
- Tamaños estándar: `h-4 w-4` (16px), `h-5 w-5` (20px), `h-10 w-10` (círculo decorativo).
- Los círculos decorativos en modales usan: `flex h-10 w-10 items-center justify-center rounded-xl bg-XXX-50 dark:bg-XXX-900/30`.

---

## 16. Notificaciones (Toast)

📄 React Hot Toast, configurado en `App.tsx`:

```tsx
<Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      borderRadius: '12px',
      background: '#1f2937',
      color: '#f9fafb',
      fontSize: '14px',
    },
  }}
/>
```

Uso:
```typescript
toast.success('Registro guardado correctamente');
toast.error('Error al guardar');
```

---

## 17. Responsive Design

| Breakpoint | Clase Tailwind | Comportamiento |
|-----------|----------------|---------------|
| < 1024px | `lg:hidden` | Sidebar oculto, botón hamburguesa + header fijo |
| ≥ 1024px | `lg:static` | Sidebar siempre visible |
| Contenido | `max-w-6xl mx-auto` | Ancho máximo centrado |
| Formularios | `grid grid-cols-1 md:grid-cols-3 gap-4` | 1 columna en móvil, 3 en desktop |
| Padding | `px-4 sm:px-6 lg:px-8` | Padding responsivo |

### 17.1 Mobile Header

En móvil aparece una barra superior fija (`fixed top-0 left-0 right-0 z-40 h-14`) con:
- Botón hamburguesa (alterna `Menu`/`X`).
- Logo + nombre de la app.
- El main content tiene `pt-14` para no solaparse con el header.
- En desktop cambia a `lg:pt-0`.

---

## 18. Estructura de una Página (Template)

```tsx
export function MiPaginaPage() {
  // Estado
  const [entity, setEntity] = useState<MiEntidadDto>(getDefault());
  const [isSaving, setIsSaving] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [navId, setNavId] = useState(0);

  // CRUD handlers
  const handleSave = async () => { /* validar → service.insert/update */ };
  const handleDelete = async () => { /* confirm → service.delete */ };
  const handleNew = () => { setEntity(getDefault()); setNavId(0); };

  // Navegación
  const navigateRecord = async (navPositionId: number) => { /* getNavBarById */ };

  // Búsqueda
  const handleSearch = useCallback(async (query: string) => { /* service.getList */ }, []);

  return (
    <Layout>
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b ...">
        <div className="px-4 sm:px-6 lg:px-8 py-2 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}><ArrowLeft /></button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Título</h1>
              <p className="text-xs text-gray-500">Subtítulo</p>
            </div>
            <OptionsBar
              onNew={handleNew}
              onSave={handleSave}
              onDelete={handleDelete}
              onSearch={() => handleSearch(searchQuery)}
              isSaving={isSaving}
              canDelete={entity.id !== 0}
              onFirst={() => navigateRecord(0)}
              onPrevious={() => navigateRecord(1)}
              onNext={() => navigateRecord(2)}
              onLast={() => navigateRecord(3)}
              showNav={true}
            />
            <input type="text" placeholder="Presione F2 para buscar..."
                   className="input-field w-48" />
          </div>
        </div>
      </div>

      {/* Form content */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="stat-card">
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* campos del formulario */}
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <SearchModal ... />
    </Layout>
  );
}
```

---

## 19. Convenciones de Nomenclatura

| Elemento | Convención |
|----------|-----------|
| Archivos de página (pages) | `NombrePlural.tsx` (ej. `Products.tsx`, `BusinessEntities.tsx`) |
| Componentes | `NombreComponente.tsx` (PascalCase) |
| Contextos | `NombreContext.tsx` (PascalCase) |
| Hooks | `useNombre.ts` (camelCase) |
| Servicios | `nombreService.ts` (camelCase) |
| Tipos (types) | `nombre.ts` (camelCase, sin "Type") |
| Constantes | `constants.ts` |
| Archivos de utilidad | `nombreUtils.ts` (camelCase) |

---

## 20. Tipos y DTOs

📄 `src/types/`

Cada entidad tiene un archivo con su DTO (interfaz de TypeScript). Los nombres siguen el backend con sufijo `Dto`:

```typescript
// types/products.ts
export interface ProductsDto {
  id: number;
  code: string;
  name: string;
  price1: number;
  price1CoinId: number;
  taxesId: number;
  // ...
}
```

El servicio del backend siempre devuelve `Result<T>`:

```typescript
// types/api.ts
export interface ApiResult<T> {
  isSuccess: boolean;
  value: T | null;
  errorMessage: string | null;
}
```

---

## 21. Servicios HTTP

📄 `src/services/api.ts` — instancia central de Axios.
📄 `src/services/*Service.ts` — wrappers por entidad.

Cada servicio expone métodos que llaman al API con `api.get/post/put/delete` y retornan `ApiResult<T>`.

```typescript
// services/productsService.ts
export const productsService = {
  getById: async (id: number) => {
    const { data } = await api.get(`/Products/GetProductsById/${id}`);
    return data as ApiResult<ProductsDto>;
  },
};
```

Los endpoints se definen en el backend (Pymex.BackEnd) y se consumen desde el frontend a través de `http://localhost:5002`.

---

## 22. Paleta de Colores por Propósito

| Propósito | Color |
|-----------|-------|
| Acción principal / guardar | Indigo (`indigo-600`) |
| Búsqueda / confirmar | Emerald (`emerald-600`) |
| Peligro / eliminar / cerrar sesión | Rose/Red (`rose-600`, `red-700`) |
| Precios / advertencia | Amber (`amber-600`) |
| Fondo del body | `gray-50` / `dark:gray-950` |
| Fondo de tarjeta | `white/80` / `dark:gray-800/80` |
| Texto principal | `gray-900` / `dark:white` |
| Texto secundario | `gray-500` / `dark:gray-400` |
| Borde | `gray-200` / `dark:gray-700` |
| Badge | `red-100 text-red-700` / `dark:red-900/40 dark:text-red-300` |
| Gradient primario | `from-indigo-600 to-violet-600` |

---

## 23. Loading / Spinner

```tsx
// Spinner circular
<div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />

// Loading state durante saves
{isSaving && <Loader2 className="h-5 w-5 animate-spin" />}
```

---

## 24. Notas Adicionales

- **Sin librerías de UI externas** — todo el diseño es Tailwind puro más Lucide para iconos.
- **Sin componentes de formulario de terceros** — los inputs son nativos con estilos Tailwind.
- **Los `select` nativos** se estilizan con la clase `input-field` para mantener consistencia.
- **Las animaciones** son sutiles (200-300ms) y solo en transiciones de estado (hover, focus, open/close).
- **El login es externo** (otra aplicación). Este frontend solo consume tokens.
- **El header es sticky** (`sticky top-0 z-30`) para que la barra de herramientas siempre sea accesible.
- **Los formularios están dentro de `stat-card`** para dar sensación de tarjeta elevada.
- **La aplicación entera** usa un contenedor `max-w-6xl mx-auto` con padding responsivo.

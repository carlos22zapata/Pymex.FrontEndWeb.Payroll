import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Variable,
  Sigma,
  Calculator,
  Coins,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Layers,
  BadgeCheck,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import logoToolTips from '../assets/logo-tooltips.png';

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Dashboard',
    items: [{ label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }],
  },
  {
    title: 'Empleados',
    items: [
      { label: 'Empleados', icon: Users, path: '/empleados' },
      { label: 'Departamentos', icon: Layers, path: '/departamentos' },
      { label: 'Cargos', icon: BadgeCheck, path: '/cargos' },
      { label: 'Contratos', icon: FileText, path: '/contratos' },
    ],
  },
  {
    title: 'Variables',
    items: [
      { label: 'Variables de Nómina', icon: Variable, path: '/variables-nomina' },
    ],
  },
  {
    title: 'Conceptos',
    items: [{ label: 'Conceptos de Nómina', icon: Sigma, path: '/conceptos-nomina' }],
  },
  {
    title: 'Monedas',
    items: [
      { label: 'Monedas', icon: Coins, path: '/monedas' },
      { label: 'Tasa de Monedas', icon: TrendingUp, path: '/tasa-monedas' },
    ],
  },
  {
    title: 'Procesos',
    items: [{ label: 'Calcular Nómina', icon: Calculator, path: '/calcular-nomina' }],
  }
];

interface SidebarProps {
  onMobileClose?: () => void;
}

export function Sidebar({ onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, selectedEnterprise, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (path: string) => {
    navigate(path);
    onMobileClose?.();
  };

  const handleLogout = () => {
    logout();
    onMobileClose?.();
    window.location.href = 'http://localhost:7200';
  };

  return (
    <aside
      className={`flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex h-16 items-center gap-2 px-4 border-b border-gray-100 dark:border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1">
            <img
              src={logoToolTips}
              alt="ToolTips"
              className="h-8 w-auto"
            />
            <span className="font-semibold text-gray-900 dark:text-white">ToolTips Nómina</span>
          </div>
        )}
        {collapsed && (
          <img
            src={logoToolTips}
            alt="TT"
            className="h-7 w-auto flex-1 cursor-pointer"
            onClick={() => setCollapsed(false)}
          />
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && selectedEnterprise && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Empresa activa</p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {selectedEnterprise.name}
          </p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-2">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleNavigate(item.path)}
                    className={`sidebar-link w-full ${collapsed ? 'justify-center px-2' : ''} ${
                      active ? 'sidebar-link-active' : 'sidebar-link-inactive'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 dark:border-gray-800">
        <div className="p-3">
          <ThemeToggle collapsed={collapsed} />
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 p-3">
        {!collapsed && user && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.userName}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
              {user.roleName || 'Usuario'}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className={`sidebar-link w-full text-rose-600 hover:bg-rose-50 ${collapsed ? 'justify-center px-2' : ''}`}
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}

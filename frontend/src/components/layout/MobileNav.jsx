import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Upload, Table2, Leaf, Menu, X, ClipboardCheck, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Proveedores Críticos', path: '/suppliers', icon: Users },
  { label: 'Cargar Archivo', path: '/upload', icon: Upload },
  { label: 'Avances', path: '/progress', icon: Table2 },
  { label: 'Evaluaciones', path: '/evaluacion', icon: ClipboardCheck },
  { label: 'Documentacion', path: '/documentation', icon: BookOpen },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Leaf className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">ESG Monitor</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {open && (
        <nav className="bg-card border-b border-border px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

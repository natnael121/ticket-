import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { firestoreService } from '../../services/firestoreService';
import { ShieldCheck, Building2, QrCode, Ticket, RotateCcw } from 'lucide-react';

export const DevRoleSwitcher: React.FC<{ currentView: string; onViewChange: (view: string) => void }> = ({
  currentView,
  onViewChange
}) => {
  const { role, switchUserRole } = useAuth();

  const handleRoleSwitch = (targetRole: UserRole, defaultView: string) => {
    switchUserRole(targetRole);
    onViewChange(defaultView);
  };

  const handleResetData = () => {
    if (confirm('Reset platform data to initial state?')) {
      firestoreService.resetState();
      window.location.reload();
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-300 text-xs px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-md z-50 sticky top-0">
      <div className="flex items-center gap-2 font-medium">
        <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider">
          Demo Switcher
        </span>
        <span className="hidden sm:inline text-slate-400">Current Role:</span>
        <span className="capitalize font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
          {role.replace('_', ' ')}
        </span>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        <button
          onClick={() => handleRoleSwitch('super_admin', 'super_admin_dashboard')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium text-xs whitespace-nowrap ${
            role === 'super_admin'
              ? 'bg-purple-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Super Admin
        </button>

        <button
          onClick={() => handleRoleSwitch('organizer', 'organizer_dashboard')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium text-xs whitespace-nowrap ${
            role === 'organizer'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Organizer
        </button>

        <button
          onClick={() => handleRoleSwitch('staff', 'scanner')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium text-xs whitespace-nowrap ${
            role === 'staff'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          Scanner Staff
        </button>

        <button
          onClick={() => handleRoleSwitch('customer', 'my_tickets')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium text-xs whitespace-nowrap ${
            role === 'customer'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          Customer
        </button>

        <button
          onClick={handleResetData}
          title="Reset Seed Data"
          className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition ml-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

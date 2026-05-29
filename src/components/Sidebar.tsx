/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Ship, 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  QrCode, 
  Users, 
  Pencil, 
  CircleCheck, 
  FileSpreadsheet,
  Moon,
  Sun,
  Receipt
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Sidebar({ activePage, setActivePage, darkMode, toggleDarkMode }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Declaration' },
    { id: 'declaration', label: 'New declaration', icon: FileText, group: 'Declaration' },
    { id: 'declarations', label: 'Declarations', icon: CheckSquare, group: 'Declaration' },
    { id: 'sticker', label: 'QR sticker', icon: QrCode, group: 'Declaration' },
    { id: 'customers', label: 'Customers', icon: Users, group: 'Declaration' },
    
    { id: 'draft', label: 'Draft shipments', icon: Pencil, group: 'Shipment' },
    { id: 'containers', label: 'Containers', icon: Ship, group: 'Shipment' },
    { id: 'active', label: 'Active shipments', icon: Ship, group: 'Shipment' },
    { id: 'completed', label: 'Completed', icon: CircleCheck, group: 'Shipment' },
    
    { id: 'manifests', label: 'Manifests', icon: FileSpreadsheet, group: 'Reports' },
    { id: 'billing', label: 'Billing & Invoices', icon: Receipt, group: 'Reports' },
  ];

  const groups = ['Declaration', 'Shipment', 'Reports'];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
            <Ship className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[13.5px] font-bold text-slate-100 tracking-tight leading-none">Sea Cargo</h1>
            <span className="text-[10px] text-slate-400 font-medium">Japan → Sri Lanka</span>
          </div>
        </div>
        <button 
          onClick={toggleDarkMode} 
          className="p-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-full transition-colors text-slate-400"
          title="Toggle Dark & Light Mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {groups.map((grp) => (
          <div key={grp}>
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase px-3 block mb-1.5">
              {grp}
            </span>
            <div className="space-y-1">
              {menuItems
                .filter((item) => item.group === grp)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[12.5px] font-medium transition-all text-left ${
                        isActive 
                          ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 rounded-l-none pl-2.5 font-semibold' 
                          : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[10.5px] text-slate-500 font-mono text-center">
        <span>Logged in as Operator</span>
      </div>
    </div>
  );
}

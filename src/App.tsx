/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import DeclarationWizard from './components/DeclarationWizard';
import DeclarationsList from './components/DeclarationsList';
import StickerGenerator from './components/StickerGenerator';
import CustomersList from './components/CustomersList';
import ShipmentsList from './components/ShipmentsList';
import ManifestsGenerator from './components/ManifestsGenerator';
import BillingManager from './components/BillingManager';

import { 
  getDeclarations, 
  saveDeclarations, 
  getBatches, 
  saveBatches, 
  getBillInvoices 
} from './utils/mockDb';
import { Declaration, ContainerBatch } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [consoleLogs, setConsoleLogs] = useState<string[]>(() => {
    return [
      `[${new Date().toLocaleTimeString()}] SYSTEM_INIT: Initializing maritime logistics core kernel...`,
      `[${new Date().toLocaleTimeString()}] DB_SYNC: Synced registered declarations & container manifests successfully.`,
      `[${new Date().toLocaleTimeString()}] NET_STATUS: Established links with Tokyo (YOK), Colombo Port Authority (SLPA).`,
      `[${new Date().toLocaleTimeString()}] TELEMETRY: Active trackers transmitting via INMARSAT-C channel.`
    ];
  });

  const addLogMsg = (text: string) => {
    setConsoleLogs(prev => [...prev.slice(-12), `[${new Date().toLocaleTimeString()}] ${text}`]);
  };

  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [batches, setBatches] = useState<ContainerBatch[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('seacargo_dark');
    return saved !== null ? saved === 'true' : true;
  });

  // Load Initial Storage Data
  useEffect(() => {
    setDeclarations(getDeclarations());
    setBatches(getBatches());
    addLogMsg(`DB_FETCH: Successfully loaded ${getDeclarations().length} customer manifests from storage.`);
  }, []);

  // Sync state modifications
  const handleAddDeclaration = (newDecl: Declaration) => {
    const updated = [newDecl, ...declarations];
    setDeclarations(updated);
    saveDeclarations(updated);
    addLogMsg(`DECL_CREATE: New House Bill ${newDecl.hblNo} (${newDecl.senderName}) compiled successfully.`);
    
    // Automatically assign this declaration to the current draft batch (SJP3)
    const updatedBatches = batches.map(b => {
      if (b.id === 'SJP3') {
        addLogMsg(`BATCH_ALLOC: Registered HBL ${newDecl.hblNo} to container container allocation SJP3.`);
        return {
          ...b,
          declarationsList: [...b.declarationsList, newDecl.hblNo]
        };
      }
      return b;
    });
    setBatches(updatedBatches);
    saveBatches(updatedBatches);
  };

  const handleUpdateDeclarationStatus = (id: string, status: 'Approved' | 'Declined', reason?: string) => {
    const updated = declarations.map(d => {
      if (d.id === id) {
        addLogMsg(`AUTH_STATE: HBL ${d.hblNo} updated to [${status.toUpperCase()}] status.`);
        return { ...d, status, declineReason: reason, approvedBy: 'System Admin' };
      }
      return d;
    });
    setDeclarations(updated);
    saveDeclarations(updated);
  };

  const handleUpdateBilling = (
    id: string, 
    fields: {
      paidAmountYen?: number;
      handlingFeeYen?: number;
      insuranceYen?: number;
      otherChargesYen?: number;
      discountYen?: number;
      cbmRateYen?: number;
    }
  ) => {
    const updated = declarations.map(d => {
      if (d.id === id) {
        const nextCbmRate = fields.cbmRateYen !== undefined ? fields.cbmRateYen : d.cbmRateYen;
        const nextHandling = fields.handlingFeeYen !== undefined ? fields.handlingFeeYen : d.handlingFeeYen;
        const nextInsurance = fields.insuranceYen !== undefined ? fields.insuranceYen : d.insuranceYen;
        const nextOther = fields.otherChargesYen !== undefined ? fields.otherChargesYen : d.otherChargesYen;
        const nextDiscount = fields.discountYen !== undefined ? fields.discountYen : d.discountYen;
        const nextPaid = fields.paidAmountYen !== undefined ? fields.paidAmountYen : d.paidAmountYen;
        
        const nextTotal = (nextCbmRate * d.totalCbm) + nextHandling + nextInsurance + nextOther - nextDiscount;
        
        addLogMsg(`BILLING_UPDATE: Cargo HBL ${d.hblNo} invoiced fees updated. Net: ¥${nextTotal.toLocaleString()} | Paid: ¥${nextPaid.toLocaleString()}.`);
        return { 
          ...d, 
          cbmRateYen: nextCbmRate,
          handlingFeeYen: nextHandling,
          insuranceYen: nextInsurance,
          otherChargesYen: nextOther,
          discountYen: nextDiscount,
          paidAmountYen: nextPaid,
          totalBillYen: nextTotal < 0 ? 0 : nextTotal
        };
      }
      return d;
    });
    setDeclarations(updated);
    saveDeclarations(updated);
  };

  const handleAddBatch = (newBatch: ContainerBatch) => {
    const updated = [...batches, newBatch];
    setBatches(updated);
    saveBatches(updated);
    addLogMsg(`BATCH_PROVISION: Container Batch ${newBatch.id} aboard vessel [${newBatch.vesselName}] added.`);
  };

  // Quick Sticker Preview Navigation trigger across views
  const [stickerOverride, setStickerOverride] = useState<any>(null);
  const handleOpenSticker = (hbl: string, sender: string, receiver: string, dest: string, items: string, type: 'D2D' | 'UPB') => {
    setStickerOverride({ hbl, sender, receiver, dest, items, type });
    setActivePage('sticker');
  };

  // Dark light class toggle
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('seacargo_dark', darkMode.toString());
  }, [darkMode]);

  // Derived list of invoices
  const bills = getBillInvoices();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-100 font-sans border border-slate-200 antialiased select-none">
      
      {/* ─── SYSTEM STATUS HEADER (High Density) ─── */}
      <header className="h-12 border-b border-slate-200 bg-slate-800 flex items-center justify-between px-4 flex-shrink-0 text-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-blue-500 rounded-sm flex items-center justify-center">
            <div className="w-3 h-3 bg-slate-100 rotate-45"></div>
          </div>
          <span className="font-mono font-bold text-xs tracking-tight">SEA_CARGO_PORTAL_v2.4_ACTIVE</span>
          <span className="px-2 py-0.5 bg-green-950/40 text-emerald-400 text-[9px] rounded border border-green-500/30 uppercase font-semibold">ONLINE</span>
        </div>
        <div className="flex items-center gap-6 text-[10px] font-mono opacity-80">
          <div className="flex gap-2"><span>VESSEL CODES:</span><span className="text-blue-400">99.8% READY</span></div>
          <div className="flex gap-2"><span>LATENCY:</span><span className="text-blue-400">4.2ms Yokohama</span></div>
          <div className="flex gap-2 text-green-400"><span>UPTIME: 1,422H</span></div>
          <div className="w-[1px] h-4 bg-slate-200"></div>
          <div className="flex gap-1 items-center"><span>OPERATOR@PORT_TOKYO</span></div>
        </div>
      </header>

      {/* ─── CORE CONTAINER BLOCK ─── */}
      <div className="flex-grow flex flex-row overflow-hidden">
        
        {/* ─── SIDEBAR NAVIGATION ─── */}
        <Sidebar 
          activePage={activePage} 
          setActivePage={(page) => {
            setActivePage(page);
            setStickerOverride(null);
            addLogMsg(`NAV_VIEW: Intercepted workspace route transition to [ID: ${page.toUpperCase()}].`);
          }}
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode(!darkMode)}
        />

        {/* ─── WORKSPACE CONTENT AND COMPONENT DISPLAY (High Density Webpack) ─── */}
        <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
          
          {/* Workpane Header Bar */}
          <div className="h-10 border-b border-slate-200 flex items-center px-4 justify-between bg-slate-50">
            <div className="flex items-center h-full">
              <button className="text-[11px] font-mono font-semibold border-b-2 border-blue-500 h-full px-3 text-blue-400 select-none">
                {activePage.toLowerCase()}_view.xml
              </button>
              <button 
                onClick={() => addLogMsg(`SYS_DUMP: Standard database dump generated for page [${activePage}].`)}
                className="text-[11px] font-mono font-medium opacity-50 hover:opacity-100 h-full px-3"
              >
                raw_manifest.csv
              </button>
              <button 
                onClick={() => addLogMsg(`SYS_HEALTH: Internal modules diagnostics status: stable.`)}
                className="text-[11px] font-mono font-medium opacity-50 hover:opacity-100 h-full px-3"
              >
                vessel_links.io
              </button>
            </div>
            <div className="text-[10px] font-mono opacity-60">
              STREAMS: LIVE_YOKOHAMA_REPORTS_SYS01
            </div>
          </div>

          {/* Core App Main Frame */}
          <main className="flex-grow overflow-y-auto p-4 space-y-4">
            
            {activePage === 'dashboard' && (
              <DashboardView 
                declarations={declarations}
                batches={batches}
                bills={bills}
                onNavigate={(page) => {
                  setActivePage(page);
                  addLogMsg(`NAV_VIEW: Route triggered to [${page.toUpperCase()}] page.`);
                }}
                onOpenSticker={(hbl, sender, receiver, dest, items, type) => {
                  handleOpenSticker(hbl, sender, receiver, dest, items, type);
                  addLogMsg(`LABELS: Initialized printing labels inspector for HBL No ${hbl}.`);
                }}
              />
            )}

            {activePage === 'declaration' && (
              <DeclarationWizard 
                onAddDeclaration={handleAddDeclaration}
                onNavigate={setActivePage}
              />
            )}

            {activePage === 'declarations' && (
              <DeclarationsList 
                declarations={declarations}
                onUpdateStatus={handleUpdateDeclarationStatus}
                onOpenSticker={handleOpenSticker}
              />
            )}

            {activePage === 'sticker' && (
              <StickerGenerator initialData={stickerOverride} />
            )}

            {activePage === 'customers' && (
              <CustomersList 
                declarations={declarations}
                onOpenSticker={handleOpenSticker}
              />
            )}

            {activePage === 'draft' && (
              <ShipmentsList 
                batches={batches}
                declarations={declarations}
                filterStatus="Draft"
                onAddBatch={handleAddBatch}
              />
            )}

            {activePage === 'containers' && (
              <ShipmentsList 
                batches={batches}
                declarations={declarations}
                filterStatus="Loading"
                onAddBatch={handleAddBatch}
              />
            )}

            {activePage === 'active' && (
              <ShipmentsList 
                batches={batches}
                declarations={declarations}
                filterStatus="In transit"
              />
            )}

            {activePage === 'completed' && (
              <ShipmentsList 
                batches={batches}
                declarations={declarations}
                filterStatus="Delivered"
              />
            )}

            {activePage === 'manifests' && (
              <ManifestsGenerator declarations={declarations} />
            )}

            {activePage === 'billing' && (
              <BillingManager 
                declarations={declarations} 
                onUpdateBilling={handleUpdateBilling} 
              />
            )}

          </main>
        </div>
      </div>

      {/* ─── HIGH DENSITY DATA LOGS FOOTER ─── */}
      <footer className="h-24 bg-slate-100 border-t border-slate-200 flex flex-shrink-0 text-slate-400">
        <div className="w-12 flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-200 bg-slate-800">
          <div className="text-[14px] text-blue-400 font-mono italic font-bold select-none">$</div>
        </div>
        <div className="flex-1 p-2 font-mono text-[10px] overflow-hidden text-slate-400 space-y-0.5">
          {consoleLogs.slice(-4).map((log, index) => {
            let logColor = "text-slate-400";
            if (log.includes("DECL_CREATE") || log.includes("STATUS_UPDATE") || log.includes("AUTH_STATE")) {
              logColor = "text-emerald-400";
            } else if (log.includes("BATCH_ALLOC") || log.includes("BATCH_PROVISION")) {
              logColor = "text-amber-400 font-semibold";
            } else if (log.includes("NAV_VIEW")) {
              logColor = "text-blue-400";
            }
            return (
              <div key={index} className={`truncate select-none ${logColor}`}>
                {log}
              </div>
            );
          })}
          <div className="animate-pulse text-blue-500/80">
            [{new Date().toLocaleTimeString()}] Listening for active vessel telemetry packet streams... _
          </div>
        </div>
        <div className="w-48 border-l border-slate-200 flex items-center justify-center bg-slate-800">
          <div className="text-center">
            <div className="text-[13px] font-mono text-blue-500 font-bold">99.98%</div>
            <div className="text-[8px] text-slate-500 uppercase tracking-tighter">Availability Rate</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

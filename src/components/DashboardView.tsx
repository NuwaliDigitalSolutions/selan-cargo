/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Ship, Plus, QrCode, ClipboardList, Package, UserCheck, HelpCircle, ArrowRight, Layers } from 'lucide-react';
import { Declaration, ContainerBatch, BillInvoice } from '../types';

interface DashboardViewProps {
  declarations: Declaration[];
  batches: ContainerBatch[];
  bills: BillInvoice[];
  onNavigate: (page: string) => void;
  onOpenSticker: (hbl: string, sender: string, receiver: string, dest: string, items: string, type: 'D2D' | 'UPB') => void;
}

export default function DashboardView({
  declarations,
  batches,
  bills,
  onNavigate,
  onOpenSticker
}: DashboardViewProps) {
  
  // Compute metric numbers dynamically from state
  const totalHBLs = declarations.length;
  const activeShipmentsCount = batches.filter(b => b.status === 'In transit' || b.status === 'Loading').length;
  const d2dCount = declarations.filter(d => d.deliveryType === 'D2D').length;
  const upbCount = declarations.filter(d => d.deliveryType === 'UPB').length;

  const formatYen = (num: number) => `¥${Math.round(num).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Cargo Logistics Dashboard
          </h2>
          <span className="text-xs text-slate-500">Live summary of declarations, active freights, and invoice states.</span>
        </div>
        <button
          onClick={() => onNavigate('declaration')}
          className="btn bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 px-4 py-2 border-0 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Declaration
        </button>
      </div>

      {/* --- METRICS GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500" />
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">Total HBLs</span>
          <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{totalHBLs}</div>
          <span className="text-[11px] text-slate-500">Full registered manifests</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-violet-500" />
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">Active Batches</span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{activeShipmentsCount}</div>
          <span className="text-[11px] text-slate-500">In loading or transit phases</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">D2D Consignments</span>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{d2dCount}</div>
          <span className="text-[11px] text-slate-500">Scheduled door-to-door delivery</span>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">UPB Consignments</span>
          <div className="text-3xl font-extrabold text-amber-500 dark:text-amber-400">{upbCount}</div>
          <span className="text-[11px] text-slate-500">Warehouse storage / customer pickup</span>
        </div>
      </div>

      {/* --- RECENT LISTS AND BATCHES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Declarations */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-slate-400" />
              Recent declarations
            </h3>
            <button
              onClick={() => onNavigate('declarations')}
              className="text-xs text-blue-600 hover:text-blue-500 font-medium flex items-center gap-1"
            >
              See all
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-[10px] uppercase text-slate-400 tracking-wider">
                  <th className="py-2.5">HBL No.</th>
                  <th className="py-2.5">Shipper</th>
                  <th className="py-2.5">Consignee</th>
                  <th className="py-2.5">Type</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Sticker</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                {declarations.slice(0, 4).map((decl) => (
                  <tr key={decl.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-2.5 font-mono font-medium text-[11px] text-slate-900 dark:text-slate-200">{decl.hblNo}</td>
                    <td className="py-2.5 truncate max-w-[85px]" title={decl.senderName}>{decl.senderName}</td>
                    <td className="py-2.5 truncate max-w-[85px]" title={decl.receiverName}>{decl.receiverName}</td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                        decl.deliveryType === 'D2D' 
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' 
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}>
                        {decl.deliveryType}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        decl.status === 'Approved'
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : decl.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                      }`}>
                        {decl.status}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => onOpenSticker(
                          decl.hblNo, 
                          decl.senderName, 
                          decl.receiverName, 
                          decl.receiverAddr, 
                          decl.itemDescriptionList, 
                          decl.deliveryType
                        )}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded transition-all"
                        title="Open Print Label & QR"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shipments / Batches */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              Active batches &amp; containers
            </h3>
            <button
              onClick={() => onNavigate('containers')}
              className="text-xs text-blue-600 hover:text-blue-500 font-medium flex items-center gap-1"
            >
              Manage
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-[10px] uppercase text-slate-400 tracking-wider">
                  <th className="py-2.5">Batch</th>
                  <th className="py-2.5">Container ID</th>
                  <th className="py-2.5">Vessel</th>
                  <th className="py-2.5">ETA Date</th>
                  <th className="py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">{b.id}</td>
                    <td className="py-2.5 font-mono text-slate-600 dark:text-slate-300 text-[11px]">{b.containerNo}</td>
                    <td className="py-2.5">{b.vesselName}</td>
                    <td className="py-2.5">{b.eta}</td>
                    <td className="py-2.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        b.status === 'In transit'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
                          : b.status === 'Loading'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
                          : b.status === 'Delivered'
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- INVOICES SUMMARY --- */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" />
            Active Customer Bills &amp; Invoice Status
          </h3>
          <button
            onClick={() => onNavigate('billing')}
            className="text-xs text-blue-600 hover:text-blue-500 font-medium flex items-center gap-1"
          >
            Manage Invoices
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-2">Bill No.</th>
                <th className="py-3 px-2">HBL Reference</th>
                <th className="py-3 px-2">Customer / Shipper</th>
                <th className="py-3 px-2 text-right">Invoice Amount</th>
                <th className="py-3 px-2 text-right">Amount Paid</th>
                <th className="py-3 px-2 text-right">Outstanding Balance</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-2">Issued Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
              {bills.map((bill) => {
                const outstanding = bill.amountYen - bill.paidYen;
                return (
                  <tr key={bill.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-2.5 px-2 font-mono font-medium text-slate-900 dark:text-slate-200">{bill.id}</td>
                    <td className="py-2.5 px-2 font-mono text-slate-500">{bill.hblNo}</td>
                    <td className="py-2.5 px-2 font-semibold text-slate-800 dark:text-slate-200">{bill.customerName}</td>
                    <td className="py-2.5 px-2 text-right font-semibold">{formatYen(bill.amountYen)}</td>
                    <td className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-400">{formatYen(bill.paidYen)}</td>
                    <td className="py-2.5 px-2 text-right font-mono font-semibold text-red-600 dark:text-rose-400">
                      {outstanding <= 0 ? '—' : formatYen(outstanding)}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        bill.status === 'Paid'
                          ? 'bg-green-150 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : bill.status === 'Partial'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-500 font-mono text-[11px]">{bill.dateIssued}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

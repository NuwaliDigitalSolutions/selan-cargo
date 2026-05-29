/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { FileSpreadsheet, Download, FileText, CheckCircle, Info, Table, Printer } from 'lucide-react';
import { Declaration } from '../types';

interface ManifestsGeneratorProps {
  declarations: Declaration[];
}

export default function ManifestsGenerator({ declarations }: ManifestsGeneratorProps) {
  const [selectedManifest, setSelectedManifest] = useState<'authorized' | 'master' | 'loading'>('authorized');

  // CSV Generator Helper
  const downloadCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (selectedManifest === 'authorized') {
      headers = ['HBL No', 'Shipper Name', 'Shipper ID', 'Consignee Name', 'Consignee ID', 'Delivery Type', 'CBM', 'Boxes', 'Item Description'];
      rows = declarations.map(d => [
        d.hblNo, d.senderName, d.senderIdNum, d.receiverName, d.receiverIdNum, d.deliveryType, d.totalCbm.toString(), d.boxCount.toString(), d.itemDescriptionList
      ]);
    } else if (selectedManifest === 'master') {
      headers = ['UID', 'HBL No', 'Status', 'Date Submitted', 'Shipper Address', 'Shipper Tel', 'Consignee Address', 'Consignee Tel', 'Total Invoice'];
      rows = declarations.map(d => [
        d.id, d.hblNo, d.status, d.dateSubmitted, d.senderAddr, d.senderTel, d.receiverAddr, d.receiverTel, d.totalBillYen.toString()
      ]);
    } else {
      headers = ['HBL No', 'Storage C/P Location', 'Gross Weight (kg)', 'CBM Volume', 'Handling Directives', 'Assigned Agent Warehouse'];
      rows = declarations.map(d => [
        d.hblNo, 'A' + Math.floor(1 + Math.random() * 9), d.totalGrossWtKg.toString(), d.totalCbm.toString(), d.specialNotes || 'None', d.destinationWarehouse
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedManifest}_manifest_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Manifests &amp; Reports Center
        </h2>
        <p className="text-xs text-slate-500 font-medium">Generate, inspect, and export customs-compliant Excel sheets on the fly.</p>
      </div>

      {/* --- GRID DECISION CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1 */}
        <button
          onClick={() => setSelectedManifest('authorized')}
          className={`p-4 border rounded-xl text-left transition-all relative ${
            selectedManifest === 'authorized'
              ? 'border-blue-500 bg-blue-50/15 ring-2 ring-blue-100 dark:ring-blue-900/10'
              : 'border-slate-200 bg-white hover:bg-slate-50/80 dark:bg-slate-800 dark:border-slate-705'
          }`}
        >
          {selectedManifest === 'authorized' && (
            <span className="absolute top-3 right-3 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-450 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>
          )}
          <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Standard Document</span>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-650" />
            Official Authorized Manifest
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 lines-clamp-2">Includes shipper &amp; consignee biometric passport codes and National IDs for Sri Lankan port authorities.</p>
        </button>

        {/* Card 2 */}
        <button
          onClick={() => setSelectedManifest('master')}
          className={`p-4 border rounded-xl text-left transition-all relative ${
            selectedManifest === 'master'
              ? 'border-blue-500 bg-blue-50/15 ring-2 ring-blue-100 dark:ring-blue-900/10'
              : 'border-slate-200 bg-white hover:bg-slate-50/80 dark:bg-slate-800 dark:border-slate-705'
          }`}
        >
          {selectedManifest === 'master' && (
            <span className="absolute top-3 right-3 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-450 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>
          )}
          <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Complete Records</span>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Table className="w-4 h-4 text-violet-650" />
            Maritime Master Manifest
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 lines-clamp-2">A complete audit list of all declarations, transaction timelines, contact phone logs, and financial receivables.</p>
        </button>

        {/* Card 3 */}
        <button
          onClick={() => setSelectedManifest('loading')}
          className={`p-4 border rounded-xl text-left transition-all relative ${
            selectedManifest === 'loading'
              ? 'border-blue-500 bg-blue-50/15 ring-2 ring-blue-100 dark:ring-blue-900/10'
              : 'border-slate-200 bg-white hover:bg-slate-50/80 dark:bg-slate-800 dark:border-slate-705'
          }`}
        >
          {selectedManifest === 'loading' && (
            <span className="absolute top-3 right-3 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-450 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>
          )}
          <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Warehouse Placement</span>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-emerald-650" />
            Loading Chart &amp; Warehouse Manifest
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 lines-clamp-2">Includes storage grid placement indexes, box weight balances, and special safety handling criteria.</p>
        </button>

      </div>

      {/* --- PREVIEW AND DOWNLOAD ACTION BLOCK --- */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-xl shadow-sm overflow-hidden text-left">
        <div className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700 p-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Preview Spreadsheet ({selectedManifest === 'authorized' ? 'Authorized Customs' : selectedManifest === 'master' ? 'Master Audit' : 'Warehouse Loading'})
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="btn btn-sm hover:bg-slate-150 text-slate-650 flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Report
            </button>
            <button
              onClick={downloadCSV}
              className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 border-none shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {selectedManifest === 'authorized' ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-700 font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-4">House Bill No.</th>
                  <th className="py-2.5 px-3">Shipper (Japan)</th>
                  <th className="py-2.5 px-3">Passport / NIC</th>
                  <th className="py-2.5 px-3">Consignee (SL)</th>
                  <th className="py-2.5 px-3">NIC Reference</th>
                  <th className="py-2.5 px-3 text-center">CBM</th>
                  <th className="py-2.5 px-3 text-center">Cartons</th>
                  <th className="py-2.5 px-4">Declared Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-705 text-slate-700 dark:text-slate-300">
                {declarations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-200">{d.hblNo}</td>
                    <td className="py-3 px-3 font-semibold">{d.senderName}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{d.senderIdNum || '—'}</td>
                    <td className="py-3 px-3">{d.receiverName}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{d.receiverIdNum || '—'}</td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-blue-650">{d.totalCbm.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center font-mono">{d.boxCount}</td>
                    <td className="py-3 px-4 truncate max-w-[150px]" title={d.itemDescriptionList}>{d.itemDescriptionList}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : selectedManifest === 'master' ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-700 font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-4">HBL No.</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Japan Address</th>
                  <th className="py-2.5 px-3">Shipper Cell</th>
                  <th className="py-2.5 px-3">Destination Address</th>
                  <th className="py-2.5 px-3">Consignee Cell</th>
                  <th className="py-2.5 px-3 text-right">Invoiced Fee</th>
                  <th className="py-2.5 px-4 text-center">Approval Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-7s0 text-slate-700 dark:text-slate-300">
                {declarations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-200">{d.hblNo}</td>
                    <td className="py-3 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        d.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-rose-105 text-rose-800'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 truncate max-w-[150px]" title={d.senderAddr}>{d.senderAddr}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{d.senderTel}</td>
                    <td className="py-3 px-3 truncate max-w-[150px]" title={d.receiverAddr}>{d.receiverAddr}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{d.receiverTel}</td>
                    <td className="py-3 px-3 text-right font-semibold">¥{d.totalBillYen.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">{d.dateSubmitted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-700 font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-4">Tracking HBL No.</th>
                  <th className="py-2.5 px-3">Container Placement</th>
                  <th className="py-2.5 px-3 text-center">Gross Weight</th>
                  <th className="py-2.5 px-3 text-center">CBM Volume Space</th>
                  <th className="py-2.5 px-3">Storage Destination</th>
                  <th className="py-2.5 px-4">Customs Safety Directives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-705 text-slate-700 dark:text-slate-300">
                {declarations.map((d, index) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-200">{d.hblNo}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-650">BAYSIDE-A{(index % 6) + 1}</td>
                    <td className="py-3 px-3 text-center font-mono font-semibold">{d.totalGrossWtKg} kg</td>
                    <td className="py-3 px-3 text-center font-mono text-blue-600 font-medium">{d.totalCbm} m³</td>
                    <td className="py-3 px-3 font-semibold">{d.destinationWarehouse}</td>
                    <td className="py-3 px-4 text-slate-500 italic max-w-[200px] truncate" title={d.specialNotes || 'Standard handling box'}>
                      {d.specialNotes || 'No hazard warning registered.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

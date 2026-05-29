/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  CheckSquare, 
  XCircle, 
  Search, 
  QrCode, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Check, 
  ArrowRight,
  Eye,
  Trash2,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { Declaration } from '../types';

interface DeclarationsListProps {
  declarations: Declaration[];
  onUpdateStatus: (id: string, status: 'Approved' | 'Declined', reason?: string) => void;
  onOpenSticker: (hbl: string, sender: string, receiver: string, dest: string, items: string, type: 'D2D' | 'UPB') => void;
}

export default function DeclarationsList({ 
  declarations, 
  onUpdateStatus, 
  onOpenSticker 
}: DeclarationsListProps) {
  const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'declined'>('approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Modal for manual decline
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  // Tab counters
  const approvedList = declarations.filter(d => d.status === 'Approved');
  const pendingList = declarations.filter(d => d.status === 'Pending');
  const declinedList = declarations.filter(d => d.status === 'Declined');

  // Filter based on active tab and search
  const getFilteredList = () => {
    let list = approvedList;
    if (activeTab === 'pending') list = pendingList;
    if (activeTab === 'declined') list = declinedList;

    if (!searchQuery) return list;

    const query = searchQuery.toLowerCase();
    return list.filter(d => 
      d.hblNo.toLowerCase().includes(query) ||
      d.senderName.toLowerCase().includes(query) ||
      d.receiverName.toLowerCase().includes(query) ||
      d.receiverAddr.toLowerCase().includes(query) ||
      d.id.toLowerCase().includes(query)
    );
  };

  const filteredDecls = getFilteredList();

  const handleDeclineSubmit = () => {
    if (!declineId) return;
    onUpdateStatus(declineId, 'Declined', declineReason || 'Undocumented dangerous goods or irregular weight patterns.');
    setDeclineId(null);
    setDeclineReason('');
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Unified House Bill Manifests
          </h2>
          <p className="text-xs text-slate-500">Query and review approvals for customs clearance.</p>
        </div>

        {/* --- Search Box --- */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search HBL, shipper, consignee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      {/* --- Tab Selector Buttons --- */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-2">
        <button
          onClick={() => { setActiveTab('approved'); setExpandedId(null); }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'approved'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'
          }`}
        >
          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Approved ({approvedList.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('pending'); setExpandedId(null); }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Pending Evaluation ({pendingList.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('declined'); setExpandedId(null); }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'declined'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>Declined ({declinedList.length})</span>
        </button>
      </div>

      {/* --- Declarations Card --- */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        {filteredDecls.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <ClipboardList className="w-8 h-8 mx-auto opacity-30 text-slate-500" />
            <p className="text-xs font-semibold">No declarations found in this category.</p>
            <p className="text-[11px] text-slate-500">Refine your search query or check other approval tabs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase text-[10.5px] tracking-wider">
                  <th className="py-3 px-4">Tracking UID</th>
                  <th className="py-3 px-3">House Bill (HBL)</th>
                  <th className="py-3 px-3">Shipper (Japan)</th>
                  <th className="py-3 px-3">Consignee (SL)</th>
                  <th className="py-3 px-3">Logistics Method</th>
                  <th className="py-3 px-3">Total Space</th>
                  <th className="py-3 px-3 text-right">Invoice (¥)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                {filteredDecls.map((decl) => {
                  const isExpanded = expandedId === decl.id;
                  return (
                    <>
                      <tr 
                        key={decl.id}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all cursor-pointer ${
                          isExpanded ? 'bg-blue-50/20 dark:bg-slate-700/60' : ''
                        }`}
                        onClick={() => toggleExpand(decl.id)}
                      >
                        <td className="py-3.5 px-4 font-mono font-extrabold text-[11px] text-blue-600 dark:text-blue-400">
                          {decl.id}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                          {decl.hblNo}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-950 dark:text-slate-100">
                          {decl.senderName}
                        </td>
                        <td className="py-3.5 px-3">
                          {decl.receiverName}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            decl.deliveryType === 'D2D'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          }`}>
                            {decl.deliveryType === 'D2D' ? 'Door to Door' : 'Warehouse Pickup'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-medium text-slate-900 dark:text-slate-300">
                          {decl.totalCbm} m³ / {decl.boxCount} boxes
                        </td>
                        <td className="py-3.5 px-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                          ¥{decl.totalBillYen.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleExpand(decl.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                            title="Expand Details"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

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
                            title="Print Label &amp; QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>

                      {/* --- COLLAPSIBLE DETAILS TR --- */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 dark:bg-slate-900/50">
                          <td colSpan={8} className="py-4 px-6 border-b border-slate-200 dark:border-slate-850">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-left leading-relaxed">
                              
                              {/* Shipper Frame */}
                              <div className="space-y-1 bg-white dark:bg-slate-800 p-3.5 rounded-lg border border-slate-150 dark:border-slate-700">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Shipper Details (Japan)</span>
                                <div className="font-semibold text-slate-850 dark:text-slate-100">{decl.senderName}</div>
                                <div className="text-slate-500">{decl.senderAddr}</div>
                                <div className="text-[11px] font-mono text-slate-400 mt-1">ID: {decl.senderIdNum || '—'}</div>
                                <div className="text-[11px] font-mono text-slate-400">Tel: {decl.senderTel}</div>
                                {decl.senderEmail && <div className="text-[11px] text-slate-500 truncate">{decl.senderEmail}</div>}
                              </div>

                              {/* Consignee Frame */}
                              <div className="space-y-1 bg-white dark:bg-slate-800 p-3.5 rounded-lg border border-slate-150 dark:border-slate-700">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Consignee Details (Sri Lanka)</span>
                                <div className="font-semibold text-slate-850 dark:text-slate-100">{decl.receiverName}</div>
                                <div className="text-slate-500 flex items-start gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                  <span>{decl.deliveryAddress || decl.receiverAddr || '—'}</span>
                                </div>
                                <div className="text-[11px] font-mono text-slate-400 mt-1">ID: {decl.receiverIdNum || '—'}</div>
                                <div className="text-[11px] font-mono text-slate-400">Tel: {decl.receiverTel}</div>
                                {decl.receiverEmail && <div className="text-[11px] text-slate-500 truncate">{decl.receiverEmail}</div>}
                              </div>

                              {/* Cargo Metrics & Controls */}
                              <div className="space-y-2 bg-white dark:bg-slate-800 p-3.5 rounded-lg border border-slate-150 dark:border-slate-700 md:col-span-2 lg:col-span-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Customs Audit State</span>
                                <div className="flex justify-between font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                  <span>Gross Weight:</span>
                                  <span className="font-semibold text-slate-900 dark:text-slate-200">{decl.totalGrossWtKg} kg</span>
                                </div>
                                <div className="flex justify-between font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                  <span>CBM Volume:</span>
                                  <span className="font-semibold text-slate-900 dark:text-slate-200">{decl.totalCbm} m³</span>
                                </div>
                                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                  <span className="font-bold">Goods:</span> {decl.itemDescriptionList}
                                </div>
                                {decl.specialNotes && (
                                  <div className="text-[10.5px] italic text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 px-2 py-1 rounded">
                                    Notes: {decl.specialNotes}
                                  </div>
                                )}

                                {/* Evaluation buttons for admins if status is pending */}
                                {decl.status === 'Pending' && (
                                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                                    <button
                                      onClick={() => {
                                        onUpdateStatus(decl.id, 'Approved');
                                      }}
                                      className="btn btn-sm bg-green-600 hover:bg-green-700 text-white font-bold flex-1"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => setDeclineId(decl.id)}
                                      className="btn btn-sm bg-rose-600 hover:bg-rose-700 text-white font-bold flex-1"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                )}

                                {decl.status === 'Declined' && decl.declineReason && (
                                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-[10.5px] rounded border border-rose-100 dark:border-rose-900/40">
                                    <span className="font-bold uppercase block text-[9px] mb-0.5">Decline Reason:</span>
                                    {decl.declineReason}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- DECLINE PROMPT MODAL --- */}
      {declineId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-5 border shadow-xl text-left space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Reject Sea Cargo Declaration</h3>
              <p className="text-xs text-slate-500">Provide an administrative reason explaining the clearance refusal.</p>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Reason for declines</label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Discrepancies in total cargo weight or suspicious lithium items."
                className="w-full text-xs min-h-[80px]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeclineId(null)}
                className="btn px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineSubmit}
                className="btn px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Submit Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

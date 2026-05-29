/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Ship, 
  Layers, 
  Calendar, 
  Compass, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  ClipboardList,
  Eye,
  Plus,
  ArrowRight,
  Send,
  Download,
  Phone,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';
import { ContainerBatch, Declaration } from '../types';

interface ShipmentsListProps {
  batches: ContainerBatch[];
  declarations: Declaration[];
  filterStatus: 'Draft' | 'Loading' | 'In transit' | 'Delivered';
  onAddBatch?: (batch: ContainerBatch) => void;
}

export default function ShipmentsList({ 
  batches, 
  declarations, 
  filterStatus,
  onAddBatch 
}: ShipmentsListProps) {
  
  // State for adding a new batch modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBatchId, setNewBatchId] = useState('');
  const [newContainer, setNewContainer] = useState('');
  const [newVessel, setNewVessel] = useState('');
  const [newEtd, setNewEtd] = useState('');
  const [newEta, setNewEta] = useState('');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredBatches = batches.filter(b => b.status === filterStatus);

  const handleCreateBatch = () => {
    if (!newBatchId) {
      setErrorMessage('Verification Error: Batch ID (e.g. SJP4) is required.');
      return;
    }

    if (onAddBatch) {
      onAddBatch({
        id: newBatchId,
        containerNo: newContainer || '—',
        vesselName: newVessel || '—',
        etd: newEtd || '2026-07-01',
        eta: newEta || '2026-07-15',
        status: filterStatus,
        declarationsList: []
      });
      setShowAddModal(false);
      // Reset
      setNewBatchId('');
      setNewContainer('');
      setNewVessel('');
      setNewEtd('');
      setNewEta('');
      setInfoMessage(`Success: Cargo container batch ${newBatchId} added successfully to the pipeline manifest!`);
      setErrorMessage(null);
    }
  };

  const getStatusBanner = () => {
    switch(filterStatus) {
      case 'Draft':
        return {
          title: 'Draft shipments',
          descr: 'Prepare loaded drafts before assigning container seals and maritime ocean liners.',
          color: 'text-slate-500 border-slate-500'
        };
      case 'Loading':
        return {
          title: 'Containers - Active loading',
          descr: 'Loading manifests locally to match customs and weight guidelines.',
          color: 'text-amber-600 border-amber-500'
        };
      case 'In transit':
        return {
          title: 'Ocean liners - Active shipments',
          descr: 'Shipments currently on course from Japanese ports to Colombo Port.',
          color: 'text-blue-600 border-blue-500'
        };
      case 'Delivered':
        return {
          title: 'Delivered - Completed shipments',
          descr: 'Consignments successfully routed, cleared by customs, and delivered or picked up.',
          color: 'text-emerald-600 border-green-500'
        };
    }
  };

  const banner = getStatusBanner();

  return (
    <div className="space-y-6">
      {/* Informational and Error Toasts */}
      {errorMessage && (
        <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs rounded-lg flex items-center justify-between font-mono animate-fade-in shrink-0">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="font-bold font-mono px-2 hover:opacity-100">×</button>
        </div>
      )}
      {infoMessage && (
        <div className="p-3 bg-emerald-500/10 text-emerald-750 dark:text-emerald-400 border border-emerald-500/20 text-xs rounded-lg flex items-center justify-between font-mono animate-fade-in shrink-0">
          <span>{infoMessage}</span>
          <button onClick={() => setInfoMessage(null)} className="font-bold font-mono px-2 hover:opacity-100">×</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {banner.title}
          </h2>
          <p className="text-xs text-slate-500">{banner.descr}</p>
        </div>

        {/* --- Quick actions --- */}
        {onAddBatch && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 text-xs py-2 px-4 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Batch Container
          </button>
        )}
      </div>

      {/* --- Shipment table roster --- */}
      <div className="space-y-4">
        {filteredBatches.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border rounded-xl p-12 text-center text-slate-400 space-y-2">
            <Layers className="w-8 h-8 mx-auto opacity-30 text-slate-500" />
            <p className="text-xs font-semibold">No batches found in this category of the pipeline.</p>
            <p className="text-[11px] text-slate-500">Create a new batch container to allocate and load-out customer cargo.</p>
          </div>
        ) : (
          filteredBatches.map((batch) => {
            // Count declarations assigned
            const assignedHbls = batch.declarationsList;
            const assignedItems = declarations.filter(d => assignedHbls.includes(d.hblNo));
            const totalCbmAlloc = assignedItems.reduce((acc, current) => acc + current.totalCbm, 0);
            const totalBoxesAlloc = assignedItems.reduce((acc, current) => acc + current.boxCount, 0);

            return (
              <div 
                key={batch.id} 
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-xl overflow-hidden shadow-sm"
              >
                {/* Batch Header Bar */}
                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-800 dark:text-slate-200">
                      <Ship className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Batch Code: {batch.id}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                          {batch.status}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">Container ID Reference: {batch.containerNo}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>ETD: <strong className="text-slate-800 dark:text-slate-200">{batch.etd}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>ETA: <strong className="text-slate-800 dark:text-slate-200">{batch.eta}</strong></span>
                    </div>
                    <div className="col-span-2 sm:col-span-1 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 px-3 py-1 rounded font-mono font-bold text-center">
                      CBM: {totalCbmAlloc.toFixed(1)} / Total Boxes: {totalBoxesAlloc}
                    </div>
                  </div>
                </div>

                {/* Batch Assigned Declarations */}
                <div className="p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2.5">
                    Assigned House Bill Consignments ({assignedItems.length})
                  </span>

                  {assignedItems.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No customer consignments assigned to this batch loader yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-705 text-slate-400 text-[10px] uppercase">
                            <th className="py-2">HBL</th>
                            <th className="py-2">Shipper</th>
                            <th className="py-2">Receiver / Consignee</th>
                            <th className="py-2">Delivery Method</th>
                            <th className="py-2 text-center">Weight</th>
                            <th className="py-2 text-center">Volume</th>
                            <th className="py-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-705">
                          {assignedItems.map(item => (
                            <tr key={item.id}>
                              <td className="py-2.5 font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">{item.hblNo}</td>
                              <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">{item.senderName}</td>
                              <td className="py-2.5 truncate max-w-[150px]">{item.receiverName} ({item.receiverAddr})</td>
                              <td className="py-2.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                  {item.deliveryType}
                                </span>
                              </td>
                              <td className="py-2.5 text-center font-mono">{item.totalGrossWtKg} kg</td>
                              <td className="py-2.5 text-center font-mono">{item.totalCbm} m³</td>
                              <td className="py-2.5 text-center">
                                <span className="badge b-green">Approved</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Operation Controls inside Active Pipeline */}
                  {filterStatus === 'In transit' && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-705 flex flex-wrap gap-2 justify-end">
                      <button 
                        onClick={() => {
                          setInfoMessage(`Manifest Action: Customs loading chart PDF compiled successfully for marine batch ${batch.id}.`);
                          setErrorMessage(null);
                        }}
                        className="btn btn-sm text-xs hover:bg-slate-50 text-slate-650 flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Loading Chart PDF
                      </button>
                      <button 
                        onClick={() => {
                          setInfoMessage(`API Action: Compiled marine manifest and transmitted securely to Sri Lankan Ports Authority database for cargo batch ${batch.id}.`);
                          setErrorMessage(null);
                        }}
                        className="btn btn-sm text-xs text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 border-none"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Push to Consignee Portal
                      </button>
                    </div>
                  )}

                  {filterStatus === 'Delivered' && (
                    <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-705 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/10 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Contained items cleared by central customs of Sri Lanka successfully.</span>
                      </div>
                      <span className="font-mono text-[10px] uppercase">Voyage Ended</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- CREATE BATCH MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-5 border shadow-xl text-left space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Ship className="w-5 h-5 text-blue-600" />
                Initialize Batch Loader
              </h3>
              <p className="text-xs text-slate-500">Seal a container batch to begin loading customer HBL clearances.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Batch ID / Code *</label>
                <input
                  type="text"
                  placeholder="e.g. SJP4"
                  value={newBatchId}
                  onChange={(e) => setNewBatchId(e.target.value)}
                  className="w-full text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Container ID Seal No.</label>
                <input
                  type="text"
                  placeholder="e.g. MSCU940284"
                  value={newContainer}
                  onChange={(e) => setNewContainer(e.target.value)}
                  className="w-full text-xs font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Maritime Vessel Liner Identity</label>
                <input
                  type="text"
                  placeholder="e.g. EVER GREEN IV / MAERSK ADVANCE"
                  value={newVessel}
                  onChange={(e) => setNewVessel(e.target.value)}
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Maritime ETD Date</label>
                <input
                  type="date"
                  value={newEtd}
                  onChange={(e) => setNewEtd(e.target.value)}
                  className="w-full text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Projected ETA Colombo</label>
                <input
                  type="date"
                  value={newEta}
                  onChange={(e) => setNewEta(e.target.value)}
                  className="w-full text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn px-4 bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBatch}
                className="btn px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                Create Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

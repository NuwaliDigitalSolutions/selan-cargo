/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  User, 
  UserCheck, 
  Package, 
  Truck, 
  Receipt, 
  CheckCircle, 
  QrCode, 
  Plus, 
  Trash2, 
  Upload, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  Printer, 
  Download,
  AlertTriangle
} from 'lucide-react';
import { Declaration, PackItem } from '../types';
import { drawQR, openStickerPrintWindow } from '../utils/qr';

interface DeclarationWizardProps {
  onAddDeclaration: (decl: Declaration) => void;
  onNavigate: (page: string) => void;
}

export default function DeclarationWizard({ onAddDeclaration, onNavigate }: DeclarationWizardProps) {
  const [activeTab, setActiveTab] = useState<'sender' | 'receiver' | 'packing' | 'delivery' | 'billing' | 'declarations' | 'sticker'>('sender');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Tab Bar Titles
  const tabs = [
    { id: 'sender', label: '1. Sender', icon: User },
    { id: 'receiver', label: '2. Receiver', icon: UserCheck },
    { id: 'packing', label: '3. Packing', icon: Package },
    { id: 'delivery', label: '4. Delivery', icon: Truck },
    { id: 'billing', label: '5. Billing', icon: Receipt },
    { id: 'declarations', label: '6. Declaration', icon: FileText },
    { id: 'sticker', label: '7. QR Sticker', icon: QrCode }
  ] as const;

  // --- Multi-Step Form State ---
  // Sender
  const [senderName, setSenderName] = useState('');
  const [senderAddr, setSenderAddr] = useState('');
  const [senderIdNum, setSenderIdNum] = useState('');
  const [senderTel, setSenderTel] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [hblNo, setHblNo] = useState('');

  // Receiver
  const [receiverName, setReceiverName] = useState('');
  const [receiverAddr, setReceiverAddr] = useState('');
  const [receiverIdNum, setReceiverIdNum] = useState('');
  const [receiverTel, setReceiverTel] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [receiverIdPhotoFile, setReceiverIdPhotoFile] = useState<string | null>(null);

  // Packing List Dynamic Rows
  const [packRows, setPackRows] = useState<PackItem[]>([
    {
      id: '1',
      hblNo: '',
      description: 'Clothing',
      qty: 2,
      cc: 'CC-09',
      dangerGood: false,
      boxPosition: 'A1',
      netKg: 15,
      grossKg: 16,
      totalKg: 16,
      cbm: 0.6,
      unitPriceYen: 0,
      totalYen: 0
    }
  ]);
  const [boxCount, setBoxCount] = useState<number>(2);
  const [totalGrossWtKg, setTotalGrossWtKg] = useState<number>(32);
  const [totalCbm, setTotalCbm] = useState<number>(1.2);
  const [itemDescriptionList, setItemDescriptionList] = useState('Clothing, Personal Items');
  const [specialNotes, setSpecialNotes] = useState('');

  // Delivery Setting
  const [deliveryType, setDeliveryType] = useState<'D2D' | 'UPB'>('D2D');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [destinationWarehouse, setDestinationWarehouse] = useState('Colombo Warehouse');
  const [agentHbl, setAgentHbl] = useState('');

  // Billing
  const [cbmRateYen, setCbmRateYen] = useState<number>(12000);
  const [handlingFeeYen, setHandlingFeeYen] = useState<number>(2000);
  const [insuranceYen, setInsuranceYen] = useState<number>(1000);
  const [otherChargesYen, setOtherChargesYen] = useState<number>(0);
  const [discountYen, setDiscountYen] = useState<number>(500);

  // Dynamic Calculated Bills
  const freightCost = totalCbm * cbmRateYen;
  const totalBillYen = Math.max(0, freightCost + handlingFeeYen + insuranceYen + otherChargesYen - discountYen);

  // Checkboxes for Confirmation
  const [checklist, setChecklist] = useState({
    clothesFoodOnly: false,
    noAlcoholDrugs: false,
    noCommercialQty: false,
    bottomLoadingOk: false,
    phoneOnBox: false,
    noIllegalDanger: false,
    consequencesAccepted: false
  });

  // Signatures
  const [senderSigName, setSenderSigName] = useState('');
  const [sigDate, setSigDate] = useState('2026-05-28');
  const [agentSigName, setAgentSigName] = useState('Customs Desk Agent');
  const [auditDecision, setAuditDecision] = useState<'Approved' | 'Declined'>('Approved');
  const [wizardDeclineReason, setWizardDeclineReason] = useState('Prohibited hazard material or uncertified commercial goods declaration.');

  // UID generated for tracking on Step 7
  const [currentUID, setCurrentUID] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto Generate HBL
  const generateHblNum = () => {
    const serial = Math.floor(1000 + Math.random() * 9000);
    setHblNo(`HBL-0${serial}`);
  };

  // Add Dynamic packing row
  const addPackingRow = () => {
    const newId = (packRows.length + 1).toString();
    setPackRows([
      ...packRows,
      {
        id: newId,
        hblNo: hblNo,
        description: '',
        qty: 1,
        cc: 'CC-01',
        dangerGood: false,
        boxPosition: 'P' + newId,
        netKg: 10,
        grossKg: 11,
        totalKg: 11,
        cbm: 0.3,
        unitPriceYen: 0,
        totalYen: 0
      }
    ]);
  };

  const removePackingRow = (id: string) => {
    if (packRows.length === 1) return;
    setPackRows(packRows.filter(r => r.id !== id));
  };

  const updatePackingRow = (id: string, field: keyof PackItem, value: any) => {
    setPackRows(
      packRows.map(r => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          if (field === 'qty' || field === 'grossKg') {
            updated.totalKg = Number(updated.qty || 0) * Number(updated.grossKg || 0);
          }
          return updated;
        }
        return r;
      })
    );
  };

  // On page entry generate HBL
  useEffect(() => {
    if (!hblNo) {
      generateHblNum();
    }
  }, [hblNo]);

  // Recalculates packing aggregations when rows modify
  useEffect(() => {
    const counts = packRows.reduce((acc, row) => acc + Number(row.qty || 0), 0);
    const weight = packRows.reduce((acc, row) => acc + (Number(row.qty || 0) * Number(row.grossKg || 0)), 0);
    const volume = packRows.reduce((acc, row) => acc + Number(row.cbm || 0), 0);
    const descriptor = packRows.map(row => `${row.description || 'Misc'} ×${row.qty}`).filter(Boolean).join(', ');

    setBoxCount(counts);
    setTotalGrossWtKg(Number(weight.toFixed(1)));
    setTotalCbm(Number(volume.toFixed(2)));
    setItemDescriptionList(descriptor || 'Mixed personal personal effects');
  }, [packRows]);

  // Canvas Drawing
  useEffect(() => {
    if (activeTab === 'sticker' && qrCanvasRef.current) {
      if (!currentUID) {
        // Generate unique 6-character alpha code
        const code = 'SC-' + Math.random().toString(36).toUpperCase().substring(2, 8);
        setCurrentUID(code);
      } else {
        const trackingUrl = `https://seacargo.jp/track/${currentUID}`;
        drawQR(qrCanvasRef.current, trackingUrl);
      }
    }
  }, [activeTab, currentUID]);

  // Format Text for Whatsapp
  const buildWhatsAppLink = () => {
    const text = `*Sea Cargo Japan to Sri Lanka Booking*
---------------------------------------
*HBL No:* ${hblNo || 'Pending'}
*Tracking ID:* ${currentUID || 'SC-Pending'}
*Sender:* ${senderName || 'N/A'}
*Receiver:* ${receiverName || 'N/A'}
*Delivery Address:* ${deliveryType === 'D2D' ? deliveryAddress || receiverAddr : 'Warehouse pickup'}
*Consignment detail:* ${itemDescriptionList}
*Packing Stats:* ${boxCount} boxes | Gross Weight: ${totalGrossWtKg}kg | Space: ${totalCbm} CBM
*Total Cost:* ¥${totalBillYen.toLocaleString()}
---------------------------------------
Track your sea shipment status live anytime via https://seacargo.jp/track/${currentUID || 'SC-Pending'}`;

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const isFormCompletable = () => {
    return (
      checklist.clothesFoodOnly &&
      checklist.noAlcoholDrugs &&
      checklist.noCommercialQty &&
      checklist.bottomLoadingOk &&
      checklist.phoneOnBox &&
      checklist.noIllegalDanger &&
      checklist.consequencesAccepted
    );
  };

  // Save Approved State
  const handleSaveAndApprove = () => {
    if (auditDecision === 'Approved' && !isFormCompletable()) {
      setErrorMessage('Verification Required: Please check and tick all legal declaration check boxes below to certify the freight shipment is lawful.');
      setSuccessMessage(null);
      return;
    }

    if (!senderName || !receiverName) {
      setErrorMessage('Validation Error: Shipper Name (Japan) and Consignee Name (Sri Lanka) are mandatory to draft a House Bill declaration.');
      setSuccessMessage(null);
      return;
    }

    // Generate tracking UID if not already done
    const activeUID = currentUID || ('SC-' + Math.random().toString(36).toUpperCase().substring(2, 8));
    if (!currentUID) {
      setCurrentUID(activeUID);
    }

    const newDecl: Declaration = {
      id: activeUID,
      hblNo: hblNo || 'HBL-0143',
      status: auditDecision,
      declineReason: auditDecision === 'Declined' ? wizardDeclineReason : undefined,
      dateSubmitted: new Date().toISOString().split('T')[0],
      approvedBy: auditDecision === 'Approved' ? 'Auto Assister' : undefined,
      
      senderName,
      senderAddr,
      senderIdNum,
      senderTel,
      senderEmail,

      receiverName,
      receiverAddr,
      receiverIdNum,
      receiverTel,
      receiverEmail,
      receiverIdPhoto: receiverIdPhotoFile || undefined,

      boxCount,
      totalGrossWtKg,
      totalCbm,
      itemDescriptionList,
      specialNotes,

      deliveryType,
      deliveryAddress: deliveryType === 'D2D' ? (deliveryAddress || receiverAddr) : '',
      destinationWarehouse,
      agentHbl,

      cbmRateYen,
      cbmQty: totalCbm,
      handlingFeeYen,
      insuranceYen,
      otherChargesYen,
      discountYen,
      totalBillYen,
      paidAmountYen: 0, // initially unpaid
      
      senderSignature: senderSigName ? `Signed by ${senderSigName}` : undefined,
      senderSignatureDate: sigDate,
      agentSignature: agentSigName ? `Signed by ${agentSigName}` : undefined,
      agentSignatureDate: sigDate
    };

    onAddDeclaration(newDecl);
    if (auditDecision === 'Approved') {
      setSuccessMessage(`Declaration draft compiled and APPROVED successfully! Unified HBL Tracking Number: ${activeUID}. Proceeding to Step 7 for QR sticker.`);
      setErrorMessage(null);
      setActiveTab('sticker');
    } else {
      setSuccessMessage(`Declaration draft compiled and registered as DECLINED! Unified HBL Tracking Number: ${activeUID}. Auto-redirecting to Manifests database.`);
      setErrorMessage(null);
      setTimeout(() => {
        onNavigate('declarations');
      }, 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Feedback Banners */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 text-xs rounded-lg flex items-center justify-between font-mono animate-fade-in shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="font-bold text-[14px] hover:text-rose-700 px-2 leading-none">×</button>
        </div>
      )}
      {successMessage && (
        <div className="p-3.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-xs rounded-lg flex items-center justify-between font-mono animate-fade-in shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="font-bold text-[14px] hover:text-emerald-700 px-2 leading-none">×</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Sea Cargo Declaration Wizard
          </h2>
          <p className="text-xs text-slate-500">Fill shipper, consignee, box details, rates, and approve legal stickers.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900">
          <span>HBL Serial No:</span>
          <span className="font-bold underline text-blue-800 dark:text-blue-200">{hblNo || 'Pending'}</span>
        </div>
      </div>

      {/* --- HORIZONTAL PORTAL NAVIGATION --- */}
      <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-none flex gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                isActive 
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/10' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* ==================== 1. SENDER DETAILS ==================== */}
        {activeTab === 'sender' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold border-b border-slate-100 dark:border-slate-700 pb-2 text-slate-900 dark:text-slate-100">
              Sender Details (Shipper in Japan)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Shipper Full Name *</label>
                <input 
                  type="text" 
                  value={senderName} 
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Sunil Fukuoka"
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Japan Residence Address</label>
                <input 
                  type="text" 
                  value={senderAddr} 
                  onChange={(e) => setSenderAddr(e.target.value)}
                  placeholder="Prefecture, city, street, Japan"
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Passport / NIC Number</label>
                <input 
                  type="text" 
                  value={senderIdNum} 
                  onChange={(e) => setSenderIdNum(e.target.value)}
                  placeholder="e.g. N1029304 / 940384930V"
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Japan Contact / WhatsApp *</label>
                <input 
                  type="text" 
                  value={senderTel} 
                  onChange={(e) => setSenderTel(e.target.value)}
                  placeholder="e.g. +81 90-1234-5678"
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Shipper Email</label>
                <input 
                  type="email" 
                  value={senderEmail} 
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="sender@email.jp"
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">House Bill of Lading (HBL) No.</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={hblNo} 
                    onChange={(e) => setHblNo(e.target.value)}
                    placeholder="Enter manual or auto"
                    className="w-full text-xs font-mono"
                  />
                  <button 
                    onClick={generateHblNum} 
                    className="btn px-3 flex items-center justify-center gap-1 hover:bg-slate-50 shrink-0 text-slate-600"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Auto
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-150 dark:border-slate-700">
              <button 
                onClick={() => setActiveTab('receiver')}
                className="btn bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
              >
                Receiver Details
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ==================== 2. RECEIVER DETAILS ==================== */}
        {activeTab === 'receiver' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold border-b border-slate-100 dark:border-slate-700 pb-2 text-slate-900 dark:text-slate-100">
              Receiver Details (Consignee in Sri Lanka)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Receiver Full Name *</label>
                <input 
                  type="text" 
                  value={receiverName} 
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="e.g. Dilani Perera"
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Sri Lanka Delivery Address</label>
                <input 
                  type="text" 
                  value={receiverAddr} 
                  onChange={(e) => setReceiverAddr(e.target.value)}
                  placeholder="House number, street name, city, Sri Lanka"
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">National ID (NIC) / Passport No.</label>
                <input 
                  type="text" 
                  value={receiverIdNum} 
                  onChange={(e) => setReceiverIdNum(e.target.value)}
                  placeholder="e.g. 19901482049V"
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Contact Telephone / WhatsApp *</label>
                <input 
                  type="text" 
                  value={receiverTel} 
                  onChange={(e) => setReceiverTel(e.target.value)}
                  placeholder="e.g. +94 77-123-4567"
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Receiver Email</label>
                <input 
                  type="email" 
                  value={receiverEmail} 
                  onChange={(e) => setReceiverEmail(e.target.value)}
                  placeholder="receiver@gmail.com"
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Consignee NIC Document Upload</label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Browse Consignee NIC Image</span>
                  <span className="text-[9px] text-slate-400">PDF, JPG up to 10MB</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-150 dark:border-slate-700">
              <button 
                onClick={() => setActiveTab('sender')}
                className="btn hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Sender Section
              </button>
              <button 
                onClick={() => setActiveTab('packing')}
                className="btn bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
              >
                Packing List
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ==================== 3. PACKING LIST DETAILS ==================== */}
        {activeTab === 'packing' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Packing List — Consignment Breakdown
              </h3>
              <button
                onClick={addPackingRow}
                className="btn btn-sm bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Box Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 text-[10.5px] uppercase">
                    <th className="py-2.5 px-1">Description (e.g. Clothes, Toys)</th>
                    <th className="py-2.5 px-1 text-center w-16">Qty / Box Count</th>
                    <th className="py-2.5 px-1 text-center w-16">Customs Code</th>
                    <th className="py-2.5 px-1 text-center w-16">Danger Good?</th>
                    <th className="py-2.5 px-1 text-center w-16">CBM (Vol)</th>
                    <th className="py-2.5 px-1 text-center w-20">Gross Wt (kg)</th>
                    <th className="py-2.5 px-1 text-center w-20">Row Total Wt</th>
                    <th className="py-2.5 px-1 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {packRows.map((row) => (
                    <tr key={row.id}>
                      <td className="py-2 px-1">
                        <input 
                          type="text" 
                          value={row.description}
                          onChange={(e) => updatePackingRow(row.id, 'description', e.target.value)}
                          placeholder="Box effects..."
                          className="w-full text-xs p-1 h-8 rounded border-slate-200"
                        />
                      </td>
                      <td className="py-2 px-1 text-center">
                        <input 
                          type="number" 
                          value={row.qty}
                          onChange={(e) => updatePackingRow(row.id, 'qty', parseInt(e.target.value) || 0)}
                          className="w-16 text-xs text-center p-1 h-8 rounded border-slate-200"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input 
                          type="text" 
                          value={row.cc}
                          onChange={(e) => updatePackingRow(row.id, 'cc', e.target.value)}
                          className="w-16 text-xs text-center p-1 h-8 rounded border-slate-200"
                        />
                      </td>
                      <td className="py-2 px-1 text-center">
                        <input 
                          type="checkbox" 
                          checked={row.dangerGood}
                          onChange={(e) => updatePackingRow(row.id, 'dangerGood', e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input 
                          type="number" 
                          step="0.05"
                          value={row.cbm}
                          onChange={(e) => updatePackingRow(row.id, 'cbm', parseFloat(e.target.value) || 0)}
                          className="w-16 text-xs text-center p-1 h-8 rounded border-slate-200"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input 
                          type="number" 
                          value={row.grossKg}
                          onChange={(e) => updatePackingRow(row.id, 'grossKg', parseInt(e.target.value) || 0)}
                          className="w-20 text-xs text-center p-1 h-8 rounded border-slate-200"
                        />
                      </td>
                      <td className="py-2 px-1 text-center font-mono text-[11px] text-slate-900 dark:text-slate-350">
                        {row.totalKg} kg
                      </td>
                      <td className="py-2 px-1 text-center">
                        <button
                          onClick={() => removePackingRow(row.id)}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-rose-600 dark:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Aggregation Previews */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-150 dark:border-slate-700/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Calculated Boxes</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{boxCount} cartons</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Summary Gross G/W</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{totalGrossWtKg} kg</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Cumulative CBM</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{totalCbm} m³</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">D/G Danger Items?</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full inline-block ${
                  packRows.some(r => r.dangerGood) 
                    ? 'bg-rose-100 text-rose-800' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {packRows.some(r => r.dangerGood) ? 'YES - Prohibited Hazard' : 'NO - Allowed Clearance'}
                </span>
              </div>
            </div>

            {/* Summary Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Unified Package Items Text Description</label>
                <input 
                  type="text"
                  value={itemDescriptionList}
                  onChange={(e) => setItemDescriptionList(e.target.value)}
                  placeholder="e.g. Toys ×2, Clothes ×1, Kitchenware"
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Special Handling Directives</label>
                <input 
                  type="text"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="Fragile, do not lay horizontal, etc."
                  className="w-full text-xs"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-150 dark:border-slate-700">
              <button 
                onClick={() => setActiveTab('receiver')}
                className="btn hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Receiver Section
              </button>
              <button 
                onClick={() => setActiveTab('delivery')}
                className="btn bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
              >
                Delivery/Port Settings
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ==================== 4. DELIVERY OPTIONS ==================== */}
        {activeTab === 'delivery' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold border-b border-slate-100 dark:border-slate-700 pb-2 text-slate-900 dark:text-slate-100">
              Delivery Type &amp; Handling Agents
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-2 uppercase">Type of delivery</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input 
                      type="radio" 
                      name="deliveryType" 
                      value="D2D"
                      checked={deliveryType === 'D2D'}
                      onChange={() => setDeliveryType('D2D')}
                      className="accent-blue-600"
                    />
                    Home delivery (D2D - Door-to-Door)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input 
                      type="radio" 
                      name="deliveryType" 
                      value="UPB"
                      checked={deliveryType === 'UPB'}
                      onChange={() => setDeliveryType('UPB')}
                      className="accent-blue-600"
                    />
                    Warehouse pickup (UPB - Unaccompanied Personal Baggage)
                  </label>
                </div>
              </div>

              {deliveryType === 'D2D' && (
                <div className="bg-blue-50/40 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-950">
                  <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Specific Door Delivery Address (Sri Lanka)</label>
                  <input 
                    type="text" 
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Provide full road address in Sri Lanka (Defaults to receiver address if blank)"
                    className="w-full text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Door delivery is handled by localized courier transport trucks after port release.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Destination bonded warehouse</label>
                  <select 
                    value={destinationWarehouse}
                    onChange={(e) => setDestinationWarehouse(e.target.value)}
                    className="w-full text-xs"
                  >
                    <option value="Colombo Warehouse">Colombo Port Warehouse</option>
                    <option value="Kandy Warehouse">Kandy Bonded Warehouse</option>
                    <option value="Galle Warehouse">Galle Port Warehouse</option>
                    <option value="Jaffna Warehouse">Jaffna Cargo Station</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Agent Handling HBL Reference</label>
                  <input 
                    type="text" 
                    value={agentHbl}
                    onChange={(e) => setAgentHbl(e.target.value)}
                    placeholder="Enter agent custom index"
                    className="w-full text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-150 dark:border-slate-700">
              <button 
                onClick={() => setActiveTab('packing')}
                className="btn hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Packing Breakdown
              </button>
              <button 
                onClick={() => setActiveTab('billing')}
                className="btn bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
              >
                Invoicing Sheet
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ==================== 5. BILLING & INVOICING ==================== */}
        {activeTab === 'billing' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold border-b border-slate-100 dark:border-slate-700 pb-2 text-slate-900 dark:text-slate-100">
              Billing Statement — Freight Invoicing Form
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">CBM Unit Charge Rate (¥ per m³)</label>
                <input 
                  type="number" 
                  value={cbmRateYen}
                  onChange={(e) => setCbmRateYen(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Total Space Volume (CBM) *</label>
                <input 
                  type="number" 
                  step="0.05"
                  value={totalCbm}
                  onChange={(e) => setTotalCbm(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Standard Agent Handling Fee (¥)</label>
                <input 
                  type="number" 
                  value={handlingFeeYen}
                  onChange={(e) => setHandlingFeeYen(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Insurance Premium Policies (¥)</label>
                <input 
                  type="number" 
                  value={insuranceYen}
                  onChange={(e) => setInsuranceYen(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Other Terminal Charges (¥)</label>
                <input 
                  type="number" 
                  value={otherChargesYen}
                  onChange={(e) => setOtherChargesYen(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase">Discount Award Reduction (¥)</label>
                <input 
                  type="number" 
                  value={discountYen}
                  onChange={(e) => setDiscountYen(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs font-mono text-emerald-600"
                />
              </div>
            </div>

            {/* Invoicing Summary Block */}
            <div className="bg-slate-100 dark:bg-slate-900/60 rounded-xl p-5 border border-slate-200 dark:border-slate-750">
              <span className="text-[11px] font-extrabold text-slate-400 block mb-3 uppercase tracking-wider">Freight Cost Summary (Receipt Proposal)</span>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Sea Freight Cost ({totalCbm} CBM × ¥{cbmRateYen.toLocaleString()}/m³):</span>
                  <span className="font-mono">¥{freightCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Agent Warehouse Handling:</span>
                  <span className="font-mono">¥{handlingFeeYen.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Insurance Shield Package:</span>
                  <span className="font-mono text-blue-600 font-medium">¥{insuranceYen.toLocaleString()}</span>
                </div>
                {otherChargesYen > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Other Terminal Fees / Import Surcharges:</span>
                    <span className="font-mono">¥{otherChargesYen.toLocaleString()}</span>
                  </div>
                )}
                {discountYen > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Loyalty Voucher Discount Applied:</span>
                    <span className="font-mono">-¥{discountYen.toLocaleString()}</span>
                  </div>
                )}

                <div className="h-px bg-slate-200 dark:bg-slate-700 my-3" />
                <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  <span>Unified Grand Total Liability (Yen):</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 text-base">
                    ¥{totalBillYen.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-150 dark:border-slate-700">
              <button 
                onClick={() => setActiveTab('delivery')}
                className="btn hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Delivery Options
              </button>
              <button 
                onClick={() => setActiveTab('declarations')}
                className="btn bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
              >
                Checks &amp; Legal Sign
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ==================== 6. CHECKLIST & DECLARATION ==================== */}
        {activeTab === 'declarations' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold border-b border-slate-100 dark:border-slate-700 pb-2 text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Customs Legal Declaration Checklist (Japan Customs compliance)
            </h3>

            <span className="text-[11px] text-slate-400 font-medium block">
              You must verbally verify with the shipper and check off all seven points of security declarations below:
            </span>

            {/* Structured check items */}
            <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-750">
              <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
                <input 
                  type="checkbox" 
                  checked={checklist.clothesFoodOnly}
                  onChange={(e) => setChecklist({ ...checklist, clothesFoodOnly: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 mt-0.5 h-4 w-4 shrink-0" 
                />
                <span>Cargo ONLY consists of toys, books, footwear, clothes, stationery, and small retail food items.</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
                <input 
                  type="checkbox" 
                  checked={checklist.noAlcoholDrugs}
                  onChange={(e) => setChecklist({ ...checklist, noAlcoholDrugs: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 mt-0.5 h-4 w-4 shrink-0" 
                />
                <span>Cargo strictly DOES NOT contain alcohol, cigarettes, bulk pharmaceuticals, medical devices, hazardous lithium cells, or corrosive items.</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
                <input 
                  type="checkbox" 
                  checked={checklist.noCommercialQty}
                  onChange={(e) => setChecklist({ ...checklist, noCommercialQty: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 mt-0.5 h-4 w-4 shrink-0" 
                />
                <span>All items packed in the cartons are not of commercial scale (not more than 3 of any identical commercial food item).</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
                <input 
                  type="checkbox" 
                  checked={checklist.bottomLoadingOk}
                  onChange={(e) => setChecklist({ ...checklist, bottomLoadingOk: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 mt-0.5 h-4 w-4 shrink-0" 
                />
                <span>I understand that for heavy containers over 30 kg, default placement could cause bottom compression loading damage and the cargo company will not assume liability for unreinforced boxes.</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
                <input 
                  type="checkbox" 
                  checked={checklist.phoneOnBox}
                  onChange={(e) => setChecklist({ ...checklist, phoneOnBox: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 mt-0.5 h-4 w-4 shrink-0" 
                />
                <span>Receiver&apos;s active local Sri Lankan phone number is visibly marked on the exterior of all boxes.</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
                <input 
                  type="checkbox" 
                  checked={checklist.noIllegalDanger}
                  onChange={(e) => setChecklist({ ...checklist, noIllegalDanger: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 mt-0.5 h-4 w-4 shrink-0" 
                />
                <span>No illegal contraband, firearms, raw metals, seeds or contraband bio-threat elements inside this consignment.</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
                <input 
                  type="checkbox" 
                  checked={checklist.consequencesAccepted}
                  onChange={(e) => setChecklist({ ...checklist, consequencesAccepted: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 mt-0.5 h-4 w-4 shrink-0" 
                />
                <span>I accept that items are subjected to random customs physical screening and any false declaration could lead directly to confiscation, fines, or criminal prosecutions by the Sri Lankan Customs Board.</span>
              </label>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 border border-slate-150 dark:border-slate-700 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">A. Shipper Declaration Signature</span>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Printed Representative Name</label>
                  <input 
                    type="text" 
                    value={senderSigName}
                    onChange={(e) => setSenderSigName(e.target.value)}
                    placeholder="Enter full legal name"
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Signature Date</label>
                  <input 
                    type="date" 
                    value={sigDate}
                    onChange={(e) => setSigDate(e.target.value)}
                    className="w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-4 border border-slate-150 dark:border-slate-700 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">B. Agent / Representative Consent</span>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Witnessing Staff Name</label>
                  <input 
                    type="text" 
                    value={agentSigName}
                    onChange={(e) => setAgentSigName(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>
                <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-900/25 p-2 rounded border leading-relaxed">
                  Checking these items authorizes the immediate drafting of the official customs manifest sheets and creates tracking credentials.
                </div>
              </div>
            </div>

            {/* C. Administrative Audit Decision selection */}
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">C. Administrative Audit Decision</span>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <input
                    type="radio"
                    name="wizardAuditDecision"
                    checked={auditDecision === 'Approved'}
                    onChange={() => setAuditDecision('Approved')}
                    className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Approved Declaration (Immediate Customs Clearance)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-600 dark:text-rose-400">
                  <input
                    type="radio"
                    name="wizardAuditDecision"
                    checked={auditDecision === 'Declined'}
                    onChange={() => setAuditDecision('Declined')}
                    className="text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <span>Declined Declaration (Administrative Refusal &amp; Hold)</span>
                </label>
              </div>

              {auditDecision === 'Declined' && (
                <div className="space-y-1.5 animate-fade-in pt-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Specify Deciding Reason</label>
                  <textarea
                    value={wizardDeclineReason}
                    onChange={(e) => setWizardDeclineReason(e.target.value)}
                    placeholder="Specify why clearance was refused. (e.g., hazard batteries or bulk contraband goods found.)"
                    className="w-full text-xs"
                    rows={2}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-slate-150 dark:border-slate-700">
              <button 
                onClick={() => setActiveTab('billing')}
                className="btn hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Billing Form
              </button>
              
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => {
                    setSuccessMessage('Instructional Guide: All cargo and shipper PDFs are built-in. Verify your shipper details and proceed to the bottom sign off to generate stickers.');
                    setErrorMessage(null);
                  }}
                  className="btn text-xs hover:bg-slate-100 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Attachment Checklist
                </button>
                <button 
                  onClick={handleSaveAndApprove}
                  className={`btn text-xs text-white font-bold flex items-center justify-center gap-1.5 border-none shadow-sm ${
                    auditDecision === 'Approved'
                      ? (isFormCompletable() ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-350 dark:bg-slate-600 cursor-not-allowed text-slate-400')
                      : 'bg-rose-650 hover:bg-rose-700'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {auditDecision === 'Approved' ? 'Save & Approve Declaration' : 'Save & Decline Declaration'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 7. GENERATED QR STICKER ==================== */}
        {activeTab === 'sticker' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Auto-Generated Sea Cargo tracking sticker
                </h3>
                <span className="text-xs text-slate-400">Scan QR Code layout to index tracking states accurately.</span>
              </div>
              <span className="bg-emerald-550 text-white font-mono text-[10.5px] px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                UID: {currentUID || 'SC-Pending'}
              </span>
            </div>

            {/* --- VISUAL STICKER PREVIEW --- */}
            <div className="flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-900/60 rounded-xl">
              <div 
                id="sticker-preview-box"
                className="w-full max-w-[370px] bg-white text-slate-900 border-[3px] border-slate-950 rounded-lg overflow-hidden shadow-md font-sans"
              >
                <div className="bg-blue-800 text-white px-3.5 py-2.5 flex items-center justify-between">
                  <span className="text-[11.5px] font-bold uppercase tracking-wider">Sea Cargo — Japan → Sri Lanka</span>
                  <span className="text-[10px] font-mono font-extrabold bg-blue-900 px-2 py-0.5 rounded border border-blue-700">
                    {currentUID || 'SC-XXXXXX'}
                  </span>
                </div>
                <div className="p-3 flex gap-3 text-left">
                  {/* Canvas QR Code */}
                  <div className="shrink-0 flex items-center justify-center bg-white border p-1 rounded">
                    <canvas ref={qrCanvasRef} width="96" height="96" className="w-24 h-24" />
                  </div>
                  {/* Decrypted Fields */}
                  <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Sender</span>
                      <span className="font-semibold text-slate-850 truncate block" title={senderName}>{senderName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Receiver</span>
                      <span className="font-semibold text-slate-855 truncate block" title={receiverName}>{receiverName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Destination Address</span>
                      <span className="font-semibold text-slate-800 text-[10.5px] leading-tight block truncate" title={deliveryType === 'D2D' ? (deliveryAddress || receiverAddr) : destinationWarehouse}>
                        {deliveryType === 'D2D' ? (deliveryAddress || receiverAddr || '—') : destinationWarehouse}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Contact</span>
                        <span className="font-semibold">{receiverTel || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">HBL No.</span>
                        <span className="font-bold text-blue-700 font-mono text-[10.5px]">{hblNo || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50 p-2.5 text-left text-xs">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Declared Items ({boxCount || 0} cartons)</span>
                  <span className="text-slate-700 font-medium text-[11px] leading-tight block">
                    {itemDescriptionList || 'Mixed personal personal effects.'}
                  </span>
                </div>

                <div className="bg-blue-800 text-white text-[8px] font-bold tracking-wider text-center p-1.5 uppercase select-none">
                  SCAN QR CODE TO TRACK PARCEL STATUS IN REAL TIME
                </div>
              </div>
            </div>

            {/* --- ACTION TRIGGERS --- */}
            <div className="flex flex-wrap gap-2.5 justify-center">
              <button
                onClick={() => openStickerPrintWindow(
                  currentUID,
                  senderName,
                  receiverName,
                  deliveryType === 'D2D' ? (deliveryAddress || receiverAddr) : destinationWarehouse,
                  receiverTel,
                  hblNo,
                  itemDescriptionList,
                  qrCanvasRef.current?.toDataURL() || ''
                )}
                className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 px-5 py-2"
              >
                <Printer className="w-4 h-4" />
                Print Sticker Label
              </button>

              <button
                onClick={() => {
                  if (qrCanvasRef.current) {
                    const dataUrl = qrCanvasRef.current.toDataURL();
                    openStickerPrintWindow(
                      currentUID,
                      senderName,
                      receiverName,
                      deliveryType === 'D2D' ? (deliveryAddress || receiverAddr) : destinationWarehouse,
                      receiverTel,
                      hblNo,
                      itemDescriptionList,
                      dataUrl,
                      true
                    );
                  }
                }}
                className="btn hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>

              <a
                href={buildWhatsAppLink()}
                target="_blank"
                rel="noreferrer"
                className="btn bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold flex items-center gap-1"
              >
                Share Status via WhatsApp
              </a>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setActiveTab('declarations')}
                className="btn hover:bg-slate-50 text-slate-500 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Back to Declarations Checklist
              </button>
              <button
                onClick={() => onNavigate('declarations')}
                className="btn bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold"
              >
                View Declarations List
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

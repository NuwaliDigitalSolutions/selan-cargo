/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  DollarSign, 
  Receipt, 
  CreditCard, 
  PlusCircle, 
  Search, 
  FileText, 
  Info, 
  Check, 
  AlertCircle, 
  Download, 
  Settings, 
  CheckCircle,
  TrendingUp,
  X,
  Printer
} from 'lucide-react';
import { Declaration } from '../types';

interface BillingManagerProps {
  declarations: Declaration[];
  onUpdateBilling: (
    id: string, 
    fields: {
      paidAmountYen?: number;
      handlingFeeYen?: number;
      insuranceYen?: number;
      otherChargesYen?: number;
      discountYen?: number;
      cbmRateYen?: number;
    }
  ) => void;
}

export default function BillingManager({ declarations, onUpdateBilling }: BillingManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partial' | 'Unpaid'>('All');
  
  // Selected Invoice for Payment form or detailed PDF inspect
  const [activeInvoice, setActiveInvoice] = useState<Declaration | null>(null);
  const [activeTab, setActiveTab] = useState<'detail' | 'pay' | 'adjust' | 'print'>('detail');
  
  // Quick payment amount state
  const [payAmountInput, setPayAmountInput] = useState('');

  // Custom Printable Configuration variables
  const [printTemplate, setPrintTemplate] = useState<'standard' | 'thermal' | 'bonded'>('standard');
  const [showCustomsSeal, setShowCustomsSeal] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [hideCompanyHeader, setHideCompanyHeader] = useState(false);
  const [customFooterText, setCustomFooterText] = useState('Payment in full is required prior to cargo release at Colombo Port terminal warehouses. Material demurrage fees apply if left unclaimed past standard 14 duty calendar days.');

  
  // Calculation states
  const [handlingFeeInput, setHandlingFeeInput] = useState('');
  const [insuranceInput, setInsuranceInput] = useState('');
  const [otherChargesInput, setOtherChargesInput] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [cbmRateInput, setCbmRateInput] = useState('');

  // Status Alerts
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const triggerAlert = (text: string, type: 'success' | 'info' = 'success') => {
    setAlertMsg({ text, type });
    setTimeout(() => {
      setAlertMsg(null);
    }, 4500);
  };

  const getBillStatus = (d: Declaration): 'Paid' | 'Partial' | 'Unpaid' => {
    if (d.paidAmountYen >= d.totalBillYen) return 'Paid';
    if (d.paidAmountYen > 0) return 'Partial';
    return 'Unpaid';
  };

  // Filter lists
  const filteredInvoices = declarations.filter((d) => {
    const status = getBillStatus(d);
    const matchesStatus = statusFilter === 'All' || status === statusFilter;
    
    if (!matchesStatus) return false;
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      d.hblNo.toLowerCase().includes(query) ||
      d.senderName.toLowerCase().includes(query) ||
      d.receiverName.toLowerCase().includes(query) ||
      d.id.toLowerCase().includes(query)
    );
  });

  // Calculate dynamic metrics
  const totalBilled = declarations.reduce((sum, d) => sum + d.totalBillYen, 0);
  const totalPaid = declarations.reduce((sum, d) => sum + d.paidAmountYen, 0);
  const totalDue = totalBilled - totalPaid;
  const collectionRate = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;

  // Open interactive editor
  const handleSelectInvoice = (decl: Declaration, tab: 'detail' | 'pay' | 'adjust' | 'print') => {
    setActiveInvoice(decl);
    setActiveTab(tab);
    setPayAmountInput('');
    setHandlingFeeInput(decl.handlingFeeYen.toString());
    setInsuranceInput(decl.insuranceYen.toString());
    setOtherChargesInput(decl.otherChargesYen.toString());
    setDiscountInput(decl.discountYen.toString());
    setCbmRateInput(decl.cbmRateYen.toString());
  };

  // Save Quick Payment
  const handleRecordPaymentSubmit = () => {
    if (!activeInvoice) return;
    const payment = parseFloat(payAmountInput);
    if (isNaN(payment) || payment <= 0) {
      alert('Error: Please enter a valid positive payment entry.');
      return;
    }

    const currentPaid = activeInvoice.paidAmountYen;
    const maxPayable = activeInvoice.totalBillYen - currentPaid;
    
    if (payment > maxPayable) {
      if (!confirm(`Warning: Payment of ¥${payment.toLocaleString()} exceeds the balance due of ¥${maxPayable.toLocaleString()}. Confirm overpayment?`)) {
        return;
      }
    }

    const nextPaid = currentPaid + payment;
    onUpdateBilling(activeInvoice.id, { paidAmountYen: nextPaid });
    
    triggerAlert(`Payment of ¥${payment.toLocaleString()} posted successfully for ${activeInvoice.hblNo}!`, 'success');
    
    // Update active visual model
    setActiveInvoice({
      ...activeInvoice,
      paidAmountYen: nextPaid
    });
    setPayAmountInput('');
  };

  // Save Billing Adjustments
  const handleSaveAdjustmentsSubmit = () => {
    if (!activeInvoice) return;
    const handling = parseFloat(handlingFeeInput);
    const insurance = parseFloat(insuranceInput);
    const other = parseFloat(otherChargesInput);
    const discount = parseFloat(discountInput);
    const cbmRate = parseFloat(cbmRateInput);

    if (isNaN(handling) || isNaN(insurance) || isNaN(other) || isNaN(discount) || isNaN(cbmRate)) {
      alert('Error: One or more input adjustments are invalid numeric figures.');
      return;
    }

    // Recalculate total bill
    const nextTotal = (cbmRate * activeInvoice.totalCbm) + handling + insurance + other - discount;
    if (nextTotal < 0) {
      alert('Error: Total calculated invoice bill cannot fall below ¥0.');
      return;
    }

    onUpdateBilling(activeInvoice.id, {
      handlingFeeYen: handling,
      insuranceYen: insurance,
      otherChargesYen: other,
      discountYen: discount,
      cbmRateYen: cbmRate
    });

    triggerAlert(`Charges model adjusted and synced successfully for ${activeInvoice.hblNo}!`, 'info');

    setActiveInvoice({
      ...activeInvoice,
      handlingFeeYen: handling,
      insuranceYen: insurance,
      otherChargesYen: other,
      discountYen: discount,
      cbmRateYen: cbmRate,
      totalBillYen: nextTotal
    });
  };

  // Generate Receipt Mock download/inspect
  const triggerPrintReceipt = () => {
    if (!activeInvoice) return;
    triggerAlert(`Synthesizing customized print-ready layout for ${activeInvoice.hblNo}...`, 'success');
    
    // Popup print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const computedStatus = getBillStatus(activeInvoice);
      const invoiceNum = `INV-2026-${activeInvoice.id.replace('SC-', '')}`;
      const balanceDue = activeInvoice.totalBillYen - activeInvoice.paidAmountYen;
      
      let bodyContent = '';
      let additionalStyles = '';

      if (printTemplate === 'thermal') {
        // --- THERMAL SLIP 80mm TEMPLATE ---
        additionalStyles = `
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: 290px; 
            margin: 0 auto; 
            padding: 10px; 
            color: #000; 
            background: #fff; 
            font-size: 11px; 
          }
          .title { text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 2px; }
          .subtitle { text-align: center; font-size: 9px; color: #1e293b; margin-bottom: 12px; text-transform: uppercase; }
          .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .row h3 { margin: 0; font-size: 12px; }
          .total-net { font-size: 13px; font-weight: bold; }
          .stamp-box { 
            border: 1px dashed #000; 
            padding: 6px; 
            text-align: center; 
            font-size: 10px; 
            font-weight: bold; 
            margin: 15px auto; 
            width: 80%; 
            transform: rotate(-1deg);
          }
          .footer-notes { font-size: 9px; line-height: 1.3; text-transform: uppercase; border-top: 1px dashed #000; padding-top: 6px; margin-top: 15px; }
        `;

        bodyContent = `
          ${!hideCompanyHeader ? `
            <div class="title">SEA CARGO LOGISTICS</div>
            <div class="subtitle">Japan - Sri Lanka Clearing Depot</div>
          ` : ''}
          <div class="divider"></div>
          <div class="row"><span>INVOICE REF:</span><span>${invoiceNum}</span></div>
          <div class="row"><span>DATE EMITTED:</span><span>${activeInvoice.dateSubmitted}</span></div>
          <div class="row"><span>HBL TRACKING:</span><span style="font-weight: bold;">${activeInvoice.hblNo}</span></div>
          <div class="divider"></div>
          <div class="row"><span>SHIPPER:</span><span style="font-weight: bold;">${activeInvoice.senderName}</span></div>
          <div class="row"><span>CONSIGNEE:</span><span style="font-weight: bold;">${activeInvoice.receiverName}</span></div>
          <div class="row"><span>CARGO VOLUME:</span><span>${activeInvoice.totalCbm} CBM</span></div>
          <div class="divider"></div>
          
          ${showBreakdown ? `
            <div class="row"><span>Freight Volume Fee</span><span>¥${(activeInvoice.totalCbm * activeInvoice.cbmRateYen).toLocaleString()}</span></div>
            <div class="row"><span>Console Handling</span><span>¥${activeInvoice.handlingFeeYen.toLocaleString()}</span></div>
            <div class="row"><span>Cargo Insurance</span><span>¥${activeInvoice.insuranceYen.toLocaleString()}</span></div>
            <div class="row"><span>Other Surcharges</span><span>¥${activeInvoice.otherChargesYen.toLocaleString()}</span></div>
            ${activeInvoice.discountYen > 0 ? `<div class="row" style="color: #000;"><span>Promo Discount</span><span>-¥${activeInvoice.discountYen.toLocaleString()}</span></div>` : ''}
            <div class="divider"></div>
          ` : ''}

          <div class="row total-net"><span>NET BILL TOTAL:</span><span>¥${activeInvoice.totalBillYen.toLocaleString()}</span></div>
          <div class="row"><span>AMOUNT CREDITED:</span><span>¥${activeInvoice.paidAmountYen.toLocaleString()}</span></div>
          <div class="row total-net" style="border-top: 1px double #000; padding-top: 2px; margin-top: 2px;">
            <span>OUTSTANDING:</span>
            <span>¥${balanceDue.toLocaleString()}</span>
          </div>

          ${showCustomsSeal ? `
            <div class="stamp-box">
              *** RELEASE SEAL ***<br/>
              STATUS: ${computedStatus.toUpperCase()}<br/>
              SECURE TO BOARD LOGISTICS
            </div>
          ` : ''}

          ${showSignatures ? `
            <div class="divider" style="margin-top: 25px;"></div>
            <div class="row" style="font-size: 8px; margin-top: 12px;">
              <span>X______________________<br/>SHIPPER DECLARATION</span>
              <span>X______________________<br/>CUSTOMS SPECIALIST</span>
            </div>
          ` : ''}

          <p class="footer-notes">
            ${customFooterText}
          </p>
        `;

      } else if (printTemplate === 'bonded') {
        // --- CUSTOMS BONDED HOLD CERTIFICATE TEMPLATE ---
        additionalStyles = `
          body { 
            font-family: 'Georgia', serif; 
            padding: 40px; 
            color: #1e293b; 
            background: #fff; 
            line-height: 1.6; 
          }
          .outer-border { 
            border: 4px double #0f172a; 
            padding: 30px; 
            border-radius: 4px; 
          }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
          .agency-title { font-size: 20px; font-weight: bold; letter-spacing: 1px; color: #000; text-transform: uppercase; }
          .subject-title { font-size: 13px; font-weight: bold; margin-top: 6px; letter-spacing: 0.5px; opacity: 0.8; }
          .badge { 
            display: inline-block; 
            padding: 6px 16px; 
            font-size: 11px; 
            font-family: monospace; 
            font-weight: bold; 
            border: 2px solid #000; 
            margin-top: 10px; 
            letter-spacing: 1px;
            background: ${computedStatus === 'Paid' ? '#d1fae5' : '#fee2e2'};
            color: ${computedStatus === 'Paid' ? '#065f46' : '#991b1b'};
            border-color: ${computedStatus === 'Paid' ? '#34d399' : '#f87171'};
          }
          .notary-details { display: grid; gap: 8px; font-size: 12px; margin-bottom: 25px; border-bottom: 1px solid #cbd5e1; padding-bottom: 15px; }
          .field-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .field-label { color: #475569; font-style: italic; }
          .field-val { font-weight: bold; color: #000; }
          .cost-ledger { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 20px 0; border-radius: 6px; font-family: monospace; }
          .ledger-row { display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; }
          .stamps-area { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; }
          .circular-stamp { 
            border: 3px double #f43f5e; 
            border-radius: 50%; 
            width: 100px; 
            height: 100px; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            text-align: center; 
            font-size: 8px; 
            color: #f43f5e; 
            font-weight: bold; 
            transform: rotate(-10deg); 
            line-height: 1.2;
          }
          .sign-line { width: 170px; border-top: 1px solid #000; margin-top: 40px; text-align: center; font-size: 10px; font-family: monospace; }
          .authority-clauses { font-size: 10px; color: #64748b; line-height: 1.4; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 25px; }
        `;

        bodyContent = `
          <div class="outer-border">
            <div class="header">
              ${!hideCompanyHeader ? `
                <div class="agency-title">BONDED HUB RELEASE DECLARATION</div>
                <div class="subject-title">SEA CARGO SHIPPING APPARATUS & CREDITS DIVISION</div>
              ` : `
                <div class="agency-title">SEA CARGO SECURITY PERMIT</div>
              `}
              <div class="badge">${computedStatus.toUpperCase()} SECURE RELEASE PERMIT</div>
            </div>

            <div style="font-size: 12px; margin-bottom: 15px; line-height: 1.6;">
              This document serves as an official customs clearing statement and credit assessment record issued to Tokyo depot port wharf and Colombo shipping terminal authorities. The cargo described below is subjected to custom storage agreements and sovereign port duties under Japanese maritime protocol code 291-C.
            </div>

            <div class="notary-details">
              <div class="field-row"><span class="field-label">Emitted Invoice Identity:</span><span class="field-val">${invoiceNum}</span></div>
              <div class="field-row"><span class="field-label">Reference HBL Tracking:</span><span class="field-val">${activeInvoice.hblNo}</span></div>
              <div class="field-row"><span class="field-label">Certified Port Shipper:</span><span class="field-val">${activeInvoice.senderName}</span></div>
              <div class="field-row"><span class="field-label">Designated Consignee SL:</span><span class="field-val">${activeInvoice.receiverName}</span></div>
              <div class="field-row"><span class="field-label">Registered Cargo Volume:</span><span class="field-val">${activeInvoice.totalCbm} CBM</span></div>
              <div class="field-row"><span class="field-label">Registered Delivery Mode:</span><span class="field-val">${activeInvoice.deliveryType === 'D2D' ? 'Door to Door (D2D)' : 'Unaccompanied Personal Baggage (UPB)'}</span></div>
            </div>

            ${showBreakdown ? `
              <div class="cost-ledger">
                <div style="font-weight: bold; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 8px;">AUDITED FINANCES ACCOUNTING</div>
                <div class="ledger-row"><span>Sovereign Freight Space Portion (${activeInvoice.totalCbm} CBM @ ¥${activeInvoice.cbmRateYen.toLocaleString()})</span><span>¥${(activeInvoice.totalCbm * activeInvoice.cbmRateYen).toLocaleString()}</span></div>
                <div class="ledger-row"><span>Console Handling Tariffs</span><span>¥${activeInvoice.handlingFeeYen.toLocaleString()}</span></div>
                <div class="ledger-row"><span>Underwritten Goods Insurance Portions</span><span>¥${activeInvoice.insuranceYen.toLocaleString()}</span></div>
                <div class="ledger-row"><span>Official Colombo Port Demurrages & Surcharges</span><span>¥${activeInvoice.otherChargesYen.toLocaleString()}</span></div>
                ${activeInvoice.discountYen > 0 ? `<div class="ledger-row" style="color: #b91c1c;"><span>Applied Marketing Promotion Discount Deductions</span><span>-¥${activeInvoice.discountYen.toLocaleString()}</span></div>` : ''}
                <div class="ledger-row" style="border-top: 1.5px solid #000; margin-top: 8px; padding-top: 6px; font-weight: bold; font-size: 13px;">
                  <span>NET CALCULATED SYSTEM TOTAL DUE:</span>
                  <span>¥${activeInvoice.totalBillYen.toLocaleString()}</span>
                </div>
                <div class="ledger-row" style="color: #047857;"><span>CREDIT DEPOSITS POSTED:</span><span>¥${activeInvoice.paidAmountYen.toLocaleString()}</span></div>
                <div class="ledger-row" style="border-top: 1px double #000; font-weight: bold; font-size: 14px; margin-top: 4px; padding-top: 4px;">
                  <span>OUTSTANDING DEFICIT PENALTY:</span>
                  <span>¥${balanceDue.toLocaleString()}</span>
                </div>
              </div>
            ` : `
              <div class="cost-ledger" style="text-align: center; font-style: italic; font-size: 12px;">
                LEDGER CONSOLIDATED: Net Billing aggregate of <strong>¥${activeInvoice.totalBillYen.toLocaleString()}</strong> has been finalized. Credited deposits: <strong>¥${activeInvoice.paidAmountYen.toLocaleString()}</strong>. Realized outstanding balance: <strong>¥${balanceDue.toLocaleString()}</strong>.
              </div>
            `}

            <div class="stamps-area">
              <div>
                ${showCustomsSeal ? `
                  <div class="circular-stamp">
                    CUSTOMS OFFICE<br/>
                    <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.5px;">APPROVED</span><br/>
                    REGISTRATION AREA<br/>
                    TOKYO DEPOT 16
                  </div>
                ` : ''}
              </div>
              <div style="display: flex; gap: 40px;">
                ${showSignatures ? `
                  <div class="sign-line">
                    Shipper Cargo Signatory
                  </div>
                  <div class="sign-line">
                    Customs Registrar Seal
                  </div>
                ` : ''}
              </div>
            </div>

            <p class="authority-clauses">
              <strong>OFFICIAL ADVISORY NOTE:</strong> ${customFooterText}
            </p>
          </div>
        `;

      } else {
        // --- STANDARD CORPORATE INVOICE TEMPLATE (Default) ---
        additionalStyles = `
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif; padding: 30px; color: #1e293b; background: #fff; line-height: 1.5; }
          .header-box { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
          .logo-name { font-size: 20px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px; }
          .logo-sub { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .doc-type { font-size: 16px; font-weight: bold; text-align: right; color: #1e293b; }
          .doc-ref { font-family: monospace; font-size: 11px; text-align: right; color: #64748b; }
          .status-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-top: 5px; text-transform: uppercase; }
          .status-Paid { background: #d1fae5; color: #065f46; }
          .status-Partial { background: #fef3c7; color: #92400e; }
          .status-Unpaid { background: #fee2e2; color: #991b1b; }
          
          .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 25px; }
          .info-chunk { background: #f8fafc; border: 1px solid #f1f5f9; padding: 12px; border-radius: 6px; }
          .chunk-title { text-transform: uppercase; font-size: 9px; font-weight: bold; color: #64748b; tracking: 0.5px; margin-bottom: 5px; }
          .chunk-body { font-size: 11.5px; }
          
          .data-table { border-collapse: collapse; margin-top: 20px; width: 100%; }
          .data-table th { background: #3b82f6; color: #fff; text-align: left; font-size: 10.5px; padding: 8px; text-transform: uppercase; font-weight: bold; }
          .data-table td { font-size: 11.5px; padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
          .financial-right { display: flex; flex-direction: column; align-items: flex-end; margin-top: 20px; }
          .money-block { width: 300px; font-size: 12px; border-top: 1px solid #cbd5e1; padding-top: 10px; }
          .money-row { display: flex; justify-content: space-between; padding: 3px 0; }
          .total-net-box { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 1.5px solid #3b82f6; margin-top: 5px; padding-top: 5px; color: #0f172a; }
          
          .seal-stamp-container { 
            position: absolute; 
            right: 50px; 
            bottom: 140px; 
            border: 3px dashed #10b981; 
            border-radius: 50%; 
            width: 90px; 
            height: 90px; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            text-align: center; 
            font-size: 8px; 
            color: #10b981; 
            font-weight: bold; 
            transform: rotate(15deg);
            z-index: 10;
          }
          .sign-box { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 10px; }
          .signature-spot { width: 180px; border-top: 1px solid #64748b; text-align: center; font-size: 10px; color: #64748b; padding-top: 4px; }
          .bottom-memo { text-align: left; font-size: 10px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 40px; }
        `;

        bodyContent = `
          <div class="header-box">
            <div>
              ${!hideCompanyHeader ? `
                <div class="logo-name">SEA CARGO LOGISTICS</div>
                <div class="logo-sub">Tokyo-Colombo Marine Transportation Systems</div>
              ` : `
                <div class="logo-name">CARGO FREIGHT INVOICE</div>
              `}
            </div>
            <div>
              <div class="doc-type">OFFICIAL BILL OF CHARGES</div>
              <div class="doc-ref">Invoice Reference: ${invoiceNum}</div>
              <span class="status-badge status-${computedStatus}">${computedStatus.toUpperCase()}</span>
            </div>
          </div>

          <div class="grid-info">
            <div class="info-chunk">
              <div class="chunk-title">Sender (Shipper Japan Context)</div>
              <div class="chunk-body">
                <strong>${activeInvoice.senderName}</strong><br/>
                ${activeInvoice.senderAddr}<br/>
                Tel: ${activeInvoice.senderTel} | ID: ${activeInvoice.senderIdNum}
              </div>
            </div>
            <div class="info-chunk">
              <div class="chunk-title">Receiver (Consignee Sri Lanka Context)</div>
              <div class="chunk-body">
                <strong>${activeInvoice.receiverName}</strong><br/>
                ${activeInvoice.receiverAddr || activeInvoice.deliveryAddress}<br/>
                Tel: ${activeInvoice.receiverTel} | Type: ${activeInvoice.deliveryType === 'D2D' ? 'Door to Door' : 'Unaccompanied Cargo'}
              </div>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50%;">FARES & CHARGES DESCRIPTION</th>
                <th style="text-align: right; width: 25%;">CALCULATION VARIABLE</th>
                <th style="text-align: right; width: 25%;">AMOUNT IN YEN (¥)</th>
              </tr>
            </thead>
            <tbody>
              ${showBreakdown ? `
                <tr>
                  <td>Ocean Transit Freight Volume Billing Portion</td>
                  <td style="text-align: right; font-family: monospace;">${activeInvoice.totalCbm} CBM @ ¥${activeInvoice.cbmRateYen.toLocaleString()}</td>
                  <td style="text-align: right; font-family: monospace;">¥${(activeInvoice.totalCbm * activeInvoice.cbmRateYen).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Cargo Console Assembly & Handling Tariffs</td>
                  <td style="text-align: right; font-family: monospace;">Flat Rate</td>
                  <td style="text-align: right; font-family: monospace;">¥${activeInvoice.handlingFeeYen.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Underwritten Port Goods Insurance Account</td>
                  <td style="text-align: right; font-family: monospace;">Comprehensive</td>
                  <td style="text-align: right; font-family: monospace;">¥${activeInvoice.insuranceYen.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Port Security Surcharges & Extra Demurrages</td>
                  <td style="text-align: right; font-family: monospace;">Surcharge</td>
                  <td style="text-align: right; font-family: monospace;">¥${activeInvoice.otherChargesYen.toLocaleString()}</td>
                </tr>
                ${activeInvoice.discountYen > 0 ? `
                  <tr style="color: #b91c1c;">
                    <td>Security Promo Discount Deductible Code</td>
                    <td style="text-align: right; font-family: monospace;">Applied</td>
                    <td style="text-align: right; font-family: monospace;">-¥${activeInvoice.discountYen.toLocaleString()}</td>
                  </tr>
                ` : ''}
              ` : `
                <tr>
                  <td>Consolidated Cargo Ocean Freight Lineage (Space: ${activeInvoice.totalCbm} CBM)</td>
                  <td style="text-align: right; font-family: monospace;">Unified Rate</td>
                  <td style="text-align: right; font-family: monospace;">¥${activeInvoice.totalBillYen.toLocaleString()}</td>
                </tr>
              `}
            </tbody>
          </table>

          <div class="financial-right">
            <div class="money-block">
              <div class="money-row">
                <span style="color: #64748b;">Invoice Gross Subtotal:</span>
                <span style="font-family: monospace;">¥${activeInvoice.totalBillYen.toLocaleString()}</span>
              </div>
              <div class="money-row" style="color: #10b981;">
                <span>Total Received Credits:</span>
                <span style="font-family: monospace; font-weight: 600;">¥${activeInvoice.paidAmountYen.toLocaleString()}</span>
              </div>
              <div class="total-net-box">
                <span>NET BALANCE OUTSTANDING:</span>
                <span style="font-family: monospace;">¥${balanceDue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          ${showCustomsSeal ? `
            <div class="seal-stamp-container">
              APPROVED PERMIT<br/>
              <span style="font-size: 10px; font-weight: bold;">SECURE FARE</span><br/>
              RELEASE STAMP<br/>
              TOKYO SEA HUB
            </div>
          ` : ''}

          ${showSignatures ? `
            <div class="sign-box">
              <div class="signature-spot">Shipper Cargo Representative</div>
              <div class="signature-spot">Colombo Customs Clearance Desks</div>
            </div>
          ` : ''}

          <p class="bottom-memo">
            <strong>GUIDELINE TERMINAL PROTOCOLS:</strong> ${customFooterText}
          </p>
        `;
      }

      printWindow.document.write(`
        <html>
        <head>
          <title>Invoicing Statement — ${activeInvoice.hblNo}</title>
          <style>
            ${additionalStyles}
            @media print {
              body { background: #fff !important; color: #000 !important; }
              .outer-border { border-color: #000 !important; }
              .notary-details, .data-table td, .bottom-memo { border-color: #000 !important; }
            }
          </style>
        </head>
        <body>
          ${bodyContent}
          <script>
            setTimeout(function() {
              window.print();
            }, 350);
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const formatYen = (num: number) => `¥${Math.round(num).toLocaleString()}`;

  return (
    <div className="space-y-6 animate-fade-in" id="billing-manager-viewport">
      {/* Dynamic State feedback toast */}
      {alertMsg && (
        <div className={`p-3.5 border text-xs rounded-lg flex items-center justify-between font-mono animate-fade-in shrink-0 ${
          alertMsg.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25' 
            : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${alertMsg.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'} animate-ping`}></span>
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="font-bold text-[14px] hover:opacity-100 px-2 leading-none">×</button>
        </div>
      )}

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Billing &amp; Freight Invoices
          </h2>
          <p className="text-xs text-slate-500">Record customer credit balances, manage CBM rates, and issue print-ready statements.</p>
        </div>

        {/* --- Filters & Search Controls --- */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoices HBL, shipper..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
            />
          </div>

          {/* Quick status selective pills */}
          <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-white dark:bg-slate-800 text-[11px] font-mono">
            {(['All', 'Paid', 'Partial', 'Unpaid'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === st 
                    ? 'bg-blue-600 text-white font-bold' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- FINANCIAL STATS METRICS WIDGET --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500" />
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">Total Receivables</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">{formatYen(totalBilled)}</div>
          <span className="text-[10px] text-slate-500">Gross billing aggregate</span>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">Amount Deposited</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{formatYen(totalPaid)}</div>
          <span className="text-[10px] text-slate-500">Credited cash collection</span>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-rose-500" />
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">Outstanding Balance</span>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">{formatYen(totalDue)}</div>
          <span className="text-[10px] text-slate-500">Deficit debt pending release</span>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-violet-500" />
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">Recovery Credit Rate</span>
          <div className="text-2xl font-extrabold text-violet-600 dark:text-violet-400 font-mono flex items-center gap-1.5">
            {collectionRate.toFixed(1)}%
            <TrendingUp className="w-4 h-4 text-violet-500" />
          </div>
          <span className="text-[10px] text-slate-500">Paid portions percentage</span>
        </div>
      </div>

      {/* --- MASTER-DETAIL INVOICING WORKPANES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Invoice selection list */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-250 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Invoice Registry Ledger ({filteredInvoices.length})
            </h3>
            <span className="text-[10px] text-slate-400">Select invoice row to inspect &amp; pay</span>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <Receipt className="w-8 h-8 mx-auto opacity-30 text-slate-500" />
              <p className="text-xs font-semibold">No invoice records match criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">HBL Code</th>
                    <th className="py-2.5 px-3">Shipper Name</th>
                    <th className="py-2.5 px-3">Cargo Space</th>
                    <th className="py-2.5 px-3">Net Total</th>
                    <th className="py-2.5 px-3">Paid Portions</th>
                    <th className="py-2.5 px-3">Legal Status</th>
                    <th className="py-2.5 px-3 text-right">Ledger Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-750 dark:text-slate-350">
                  {filteredInvoices.map((inv) => {
                    const status = getBillStatus(inv);
                    const isSelected = activeInvoice?.id === inv.id;
                    return (
                      <tr 
                        key={inv.id} 
                        onClick={() => handleSelectInvoice(inv, 'detail')}
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-blue-500/10 dark:bg-blue-500/5 hover:bg-blue-500/10' 
                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-205">{inv.hblNo}</td>
                        <td className="py-3 px-3 truncate max-w-[120px]" title={inv.senderName}>{inv.senderName}</td>
                        <td className="py-3 px-3 font-mono text-[11px]">{inv.totalCbm} CBM</td>
                        <td className="py-3 px-3 font-mono font-bold">{formatYen(inv.totalBillYen)}</td>
                        <td className="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400">{formatYen(inv.paidAmountYen)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            status === 'Paid' 
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                              : status === 'Partial'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5 font-mono">
                            <button
                              onClick={() => handleSelectInvoice(inv, 'pay')}
                              className="btn btn-sm px-1.5 py-1 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1 border-none"
                              title="Post credit payment receipt"
                            >
                              <CreditCard className="w-3 h-3" />
                              Pay
                            </button>
                            <button
                              onClick={() => handleSelectInvoice(inv, 'adjust')}
                              className="btn btn-sm px-1.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 border border-slate-200"
                              title="Tweak fee structure"
                            >
                              <Settings className="w-3 h-3" />
                              Rules
                            </button>
                            <button
                              onClick={() => handleSelectInvoice(inv, 'print')}
                              className="btn btn-sm px-1.5 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1 border-none"
                              title="Set up printing options"
                            >
                              <Printer className="w-3 h-3" />
                              Print Option
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Interactive detailed pane inspector */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm flex flex-col h-fit">
          {activeInvoice ? (
            <div className="flex flex-col">
              {/* Tab Header bar */}
              <div className="p-2.5 border-b border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">{activeInvoice.hblNo}</span>
                  <span className="text-[10px] text-slate-400">({activeInvoice.senderName.split(' ')[0]})</span>
                </div>
                <button 
                  onClick={() => setActiveInvoice(null)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-658"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Selector Links */}
              <div className="flex border-b border-slate-200 dark:border-slate-700 text-[11px] font-mono">
                <button
                  onClick={() => setActiveTab('detail')}
                  className={`flex-1 text-center py-2 border-b-2 font-bold transition-all ${
                    activeTab === 'detail' 
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-slate-400 hover:text-slate-500'
                  }`}
                >
                  Statement
                </button>
                <button
                  onClick={() => setActiveTab('pay')}
                  className={`flex-1 text-center py-2 border-b-2 font-bold transition-all ${
                    activeTab === 'pay' 
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-slate-400 hover:text-slate-500'
                  }`}
                >
                  Post Payment
                </button>
                <button
                  onClick={() => setActiveTab('adjust')}
                  className={`flex-1 text-center py-2 border-b-2 font-bold transition-all ${
                    activeTab === 'adjust' 
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-slate-400 hover:text-slate-500'
                  }`}
                >
                  Edit Tariffs
                </button>
                <button
                  onClick={() => setActiveTab('print')}
                  className={`flex-1 text-center py-2 border-b-2 font-bold transition-all ${
                    activeTab === 'print' 
                      ? 'border-indigo-650 text-indigo-600 dark:text-indigo-400' 
                      : 'border-transparent text-slate-400 hover:text-slate-550'
                  }`}
                >
                  Print Option
                </button>
              </div>

              {/* Dynamic Content Display */}
              <div className="p-4 space-y-4">
                
                {/* A. STATEMENT DETAILS */}
                {activeTab === 'detail' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg space-y-2 border border-slate-150 dark:border-slate-750 font-mono text-[11px]">
                      <div className="flex justify-between"><span className="text-slate-400">Shipper Name:</span><span className="font-bold text-slate-900 dark:text-slate-100">{activeInvoice.senderName}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Receiver Name:</span><span className="font-bold text-slate-900 dark:text-slate-100">{activeInvoice.receiverName}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Destination:</span><span className="font-bold text-slate-940 text-right max-w-[170px] truncate" title={activeInvoice.receiverAddr}>{activeInvoice.receiverAddr}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Assigned HBL:</span><span className="text-slate-900 dark:text-slate-100 font-semibold">{activeInvoice.hblNo}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Cargo Volume:</span><span className="text-blue-500 font-semibold">{activeInvoice.totalCbm} CBM</span></div>
                    </div>

                    <div className="space-y-1.5 pb-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Invoice Ledger Breakdowns</span>
                      <div className="divide-y divide-slate-100 dark:divide-slate-705 text-xs">
                        <div className="flex justify-between py-1.5"><span className="text-slate-500">CBM Freight Volume ({activeInvoice.totalCbm} @ {formatYen(activeInvoice.cbmRateYen)})</span><span className="font-mono text-slate-800 dark:text-slate-200">{formatYen(activeInvoice.totalCbm * activeInvoice.cbmRateYen)}</span></div>
                        <div className="flex justify-between py-1.5"><span className="text-slate-500">Handling Console Duties</span><span className="font-mono text-slate-800 dark:text-slate-200">{formatYen(activeInvoice.handlingFeeYen)}</span></div>
                        <div className="flex justify-between py-1.5"><span className="text-slate-500">Insurance Base Plan</span><span className="font-mono text-slate-800 dark:text-slate-200">{formatYen(activeInvoice.insuranceYen)}</span></div>
                        <div className="flex justify-between py-1.5"><span className="text-slate-500">Port Demurrage / Other Fees</span><span className="font-mono text-slate-800 dark:text-slate-200">{formatYen(activeInvoice.otherChargesYen)}</span></div>
                        <div className="flex justify-between py-1.5 text-rose-500 font-semibold"><span className="text-rose-500 font-medium">Applied Promotional Discount</span><span className="font-mono">- {formatYen(activeInvoice.discountYen)}</span></div>
                        <div className="flex justify-between py-2 text-slate-900 dark:text-slate-100 font-bold border-t border-slate-200 dark:border-slate-700 text-sm">
                          <span>Net Invoiced Sum:</span>
                          <span className="font-mono">{formatYen(activeInvoice.totalBillYen)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                          <span>Amount Credited:</span>
                          <span className="font-mono">{formatYen(activeInvoice.paidAmountYen)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-slate-900 dark:text-slate-100 font-extrabold border-t border-dashed border-slate-200 dark:border-slate-700">
                          <span>Balance Deficit:</span>
                          <span className="font-mono text-rose-600 dark:text-rose-400">{formatYen(activeInvoice.totalBillYen - activeInvoice.paidAmountYen)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={triggerPrintReceipt}
                      className="btn w-full py-2 bg-slate-900 hover:bg-slate-950 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 font-bold flex items-center justify-center gap-2 border-none"
                    >
                      <Printer className="w-4 h-4" />
                      Print Official Statement (Slip)
                    </button>
                  </div>
                )}

                {/* B. POST CREDIT PAYMENT */}
                {activeTab === 'pay' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-xs leading-normal space-y-1 text-blue-700 dark:text-blue-300 font-mono">
                      <div className="flex items-center gap-1.5 font-bold"><Info className="w-3.5 h-3.5" /> Credit Entry Note</div>
                      <p>Enter the cash amount deposited by the shipper. Port authorities in Colombo will only release cargo shipments with a clear "Paid" status.</p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Log New Cash Payment (YEN)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">¥</span>
                          <input
                            type="number"
                            value={payAmountInput}
                            onChange={(e) => setPayAmountInput(e.target.value)}
                            placeholder="e.g. 15000"
                            className="w-full pl-7 py-2 text-xs"
                          />
                        </div>
                        <span className="text-[10.5px] text-slate-400 block font-mono">
                          Remaining Debt Balance: <strong className="text-rose-500">{formatYen(activeInvoice.totalBillYen - activeInvoice.paidAmountYen)}</strong>
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setPayAmountInput((activeInvoice.totalBillYen - activeInvoice.paidAmountYen).toString())}
                          className="btn text-[10px] bg-slate-100 hover:bg-slate-200 flex-1 py-1.5"
                        >
                          Fill Remaining Due
                        </button>
                        <button
                          onClick={handleRecordPaymentSubmit}
                          className="btn text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex-1 py-1.5 flex items-center justify-center gap-1 border-none"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Commit Credit
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* C. EDIT TARIFF VALUES */}
                {activeTab === 'adjust' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-500/10 rounded-lg text-xs leading-normal text-amber-800 dark:text-amber-300 font-mono">
                      <div className="flex items-center gap-1.5 font-bold"><Settings className="w-3.5 h-3.5" /> Tariffs Override Console</div>
                      <p className="text-[10.5px]">Adjust handling fees, port charges, or discounted promotions for this HBL.</p>
                    </div>

                    <div className="space-y-3 font-mono">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 uppercase block">CBM Base Rate (¥)</label>
                          <input
                            type="number"
                            value={cbmRateInput}
                            onChange={(e) => setCbmRateInput(e.target.value)}
                            className="w-full text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 uppercase block">Handling Fees (¥)</label>
                          <input
                            type="number"
                            value={handlingFeeInput}
                            onChange={(e) => setHandlingFeeInput(e.target.value)}
                            className="w-full text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 uppercase block">Insurance Premium (¥)</label>
                          <input
                            type="number"
                            value={insuranceInput}
                            onChange={(e) => setInsuranceInput(e.target.value)}
                            className="w-full text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 uppercase block">Other Port Charges (¥)</label>
                          <input
                            type="number"
                            value={otherChargesInput}
                            onChange={(e) => setOtherChargesInput(e.target.value)}
                            className="w-full text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 uppercase block">Applied Discount Deductible (¥)</label>
                        <input
                          type="number"
                          value={discountInput}
                          onChange={(e) => setDiscountInput(e.target.value)}
                          className="w-full text-xs text-rose-600 dark:text-rose-400"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={handleSaveAdjustmentsSubmit}
                          className="btn w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-1 border-none shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Apply New Calculations
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* D. PRINTING OPTIONS & LIVE CUSTOMIZED PREVIEW */}
                {activeTab === 'print' && (
                  <div className="space-y-4 animate-fade-in text-slate-800 dark:text-slate-200">
                    {/* Setup Controls */}
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest font-mono">
                        <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Print Settings Consoles
                      </div>
                      
                      {/* Template Selector dropdown */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-mono">Layout Template</label>
                          <select
                            value={printTemplate}
                            onChange={(e) => setPrintTemplate(e.target.value as any)}
                            className="w-full text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-800 dark:text-slate-100"
                          >
                            <option value="standard">Standard Corporate Bill</option>
                            <option value="thermal">Thermal Slip (80mm)</option>
                            <option value="bonded">Customs Bonded Hold Certificate</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-mono">Paper Dimensions</label>
                          <div className="py-1 px-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 font-semibold select-none flex items-center justify-between text-[11px] h-[26px]">
                            <span>{printTemplate === 'thermal' ? 'Continuous (3.12")' : 'Standard Letter / A4'}</span>
                            <span className="text-[9px] uppercase font-mono px-1 rounded bg-slate-250 dark:bg-slate-800 text-slate-500">{printTemplate === 'thermal' ? 'Thermal' : 'PDF'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Checkbox settings */}
                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[10.5px] font-mono p-1 border-t border-slate-200 dark:border-slate-700/60 pt-2.5">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:opacity-85">
                          <input
                            type="checkbox"
                            checked={showCustomsSeal}
                            onChange={(e) => setShowCustomsSeal(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900"
                          />
                          <span>Approved Stamp Seal</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:opacity-85">
                          <input
                            type="checkbox"
                            checked={showSignatures}
                            onChange={(e) => setShowSignatures(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900"
                          />
                          <span>Signature Lines</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:opacity-85">
                          <input
                            type="checkbox"
                            checked={showBreakdown}
                            onChange={(e) => setShowBreakdown(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900"
                          />
                          <span>Itemized Breakdown</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:opacity-85">
                          <input
                            type="checkbox"
                            checked={!hideCompanyHeader}
                            onChange={(e) => setHideCompanyHeader(!e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900"
                          />
                          <span>Corporate Branding</span>
                        </label>
                      </div>

                      {/* Footer customization */}
                      <div className="space-y-1 pt-1.5 border-t border-slate-200 dark:border-slate-700/60">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-mono font-medium">Custom Remarks Footer (Notes)</label>
                        <textarea
                          rows={2}
                          value={customFooterText}
                          onChange={(e) => setCustomFooterText(e.target.value)}
                          placeholder="Place terms, bank details, or warehouse guidelines..."
                          className="w-full text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    {/* Tiny Paper Live Preview mockup */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Simulated Live Layout Preview</span>
                      
                      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-inner p-4 flex justify-center">
                        <div className={`bg-white text-slate-900 shadow-lg border border-slate-200 font-sans p-4 relative text-left overflow-y-auto max-h-[300px] select-text transition-all ${
                          printTemplate === 'thermal' ? 'w-[250px] text-[10px] border-l-4 border-r-4 border-slate-300' : 'w-full text-[11px] rounded-lg'
                        }`}>
                          
                          {/* Inside Paper live preview simulator */}
                          {printTemplate === 'bonded' ? (
                            <div className="border-2 border-slate-900 p-2.5">
                              {!hideCompanyHeader && (
                                <div className="text-center border-b pb-1 mb-2 border-slate-900">
                                  <h4 className="font-bold text-xs tracking-tight text-slate-900 font-serif">BONDED HOLD CERTIFICATE</h4>
                                  <p className="text-[8px] text-slate-500 italic font-mono">SEA CARGO SHIPPING APPARATUS</p>
                                </div>
                              )}
                              
                              <div className="space-y-1 font-mono text-[9px]">
                                <div className="flex justify-between font-bold"><span>Ref Code:</span><span>INV-2026-{activeInvoice.id.slice(0, 5).toUpperCase()}</span></div>
                                <div className="flex justify-between"><span>Tracking HBL:</span><span className="font-bold">{activeInvoice.hblNo}</span></div>
                                <div className="flex justify-between"><span>Shipper JPN:</span><span>{activeInvoice.senderName}</span></div>
                                <div className="flex justify-between"><span>Consignee SL:</span><span>{activeInvoice.receiverName}</span></div>
                                <div className="flex justify-between"><span>Cargo Vol:</span><span>{activeInvoice.totalCbm} CBM</span></div>
                              </div>
                              
                              <div className="border-t border-slate-400 my-2 py-1 space-y-1 font-mono text-[8px] bg-slate-50 p-1">
                                {showBreakdown ? (
                                  <>
                                    <div className="flex justify-between"><span>Freight Vol Fare:</span><span>¥{(activeInvoice.totalCbm * activeInvoice.cbmRateYen).toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span>Console Handling Charge:</span><span>¥{activeInvoice.handlingFeeYen.toLocaleString()}</span></div>
                                    {activeInvoice.discountYen > 0 && <div className="flex justify-between text-rose-600"><span>Promo Discount:</span><span>-¥{activeInvoice.discountYen.toLocaleString()}</span></div>}
                                  </>
                                ) : (
                                  <div className="italic text-center text-slate-500">Breakout breakdown consolidated.</div>
                                )}
                                <div className="flex justify-between border-t border-dashed pt-1 font-bold text-[9.5px]"><span>TOTAL DEBT:</span><span>¥{activeInvoice.totalBillYen.toLocaleString()}</span></div>
                              </div>
                              
                              <p className="mt-3 text-[7.5px] text-slate-500 font-serif border-t pt-1 leading-normal font-normal">
                                <strong>ADVISORY NOTE:</strong> {customFooterText}
                              </p>
                            </div>
                          ) : (
                            <>
                              {!hideCompanyHeader && (
                                <div className="border-b pb-1.5 mb-2 border-slate-200">
                                  <h4 className="font-bold text-xs tracking-tight text-slate-900 font-sans">SEA CARGO LOGISTICS</h4>
                                  <p className="text-[8.5px] text-slate-500 font-mono">Japan - Sri Lanka Custom Lineage</p>
                                </div>
                              )}

                              <div className="space-y-1 font-mono text-[10px]">
                                <div className="flex justify-between">
                                  <span>Invoice Ref:</span>
                                  <span className="font-semibold">INV-2026-{activeInvoice.id.slice(0, 5)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>House Bill No:</span>
                                  <span className="font-bold text-blue-600">{activeInvoice.hblNo}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Consignee:</span>
                                  <span className="truncate max-w-[120px] font-semibold">{activeInvoice.receiverName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Cargo Vol:</span>
                                  <span>{activeInvoice.totalCbm} CBM</span>
                                </div>
                              </div>

                              {showBreakdown ? (
                                <div className="border-t border-dashed my-2 py-1.5 font-mono space-y-0.5 text-[9.5px]">
                                  <div className="flex justify-between">
                                    <span>Freight Space Fare:</span>
                                    <span>¥{(activeInvoice.totalCbm * activeInvoice.cbmRateYen).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Handling Tariff:</span>
                                    <span>¥{activeInvoice.handlingFeeYen.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Insurance Limit:</span>
                                    <span>¥{activeInvoice.insuranceYen.toLocaleString()}</span>
                                  </div>
                                  {activeInvoice.discountYen > 0 && (
                                    <div className="flex justify-between text-rose-600 font-semibold">
                                      <span>Applied Discount:</span>
                                      <span>-¥{activeInvoice.discountYen.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="border-t border-dashed my-2 py-1 text-slate-500 italic font-mono text-[9px]">
                                  Breakout breakdown consolidated.
                                </div>
                              )}

                              <div className="border-t border-double pt-1 mt-1 font-mono flex justify-between font-extrabold text-[12.5px] border-slate-300">
                                <span>NET TOTAL DUE:</span>
                                <span>¥{activeInvoice.totalBillYen.toLocaleString()}</span>
                              </div>

                              <div className="flex justify-between font-mono text-[10px] mt-0.5 text-emerald-600 font-bold">
                                <span>Credits Deposited:</span>
                                <span>¥{activeInvoice.paidAmountYen.toLocaleString()}</span>
                              </div>

                              {/* Stamp seal simulation */}
                              {showCustomsSeal && (
                                <div className="absolute right-4 bottom-14 pointer-events-none transform rotate-12 flex flex-col items-center justify-center p-1 border border-dashed border-emerald-500 text-[7px] font-bold rounded">
                                  <div className="text-emerald-600 uppercase border border-dashed border-emerald-600 px-1 text-center font-bold tracking-widest scale-95">
                                    APPROVED SEAFARER
                                    <div className="text-[5.5px] tracking-normal font-normal">RELEASE PASSED</div>
                                  </div>
                                </div>
                              )}

                              {showSignatures && (
                                <div className="mt-4 pt-1.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-[8px] text-slate-400 font-mono">
                                  <div>
                                    <span>Shipper Sign</span>
                                    <div className="h-3 border-b border-slate-200 border-dashed"></div>
                                  </div>
                                  <div>
                                    <span>Customs Registrar</span>
                                    <div className="h-3 border-b border-slate-200 border-dashed"></div>
                                  </div>
                                </div>
                              )}

                              <p className="mt-4 text-[8px] text-slate-400 font-mono uppercase tracking-tight leading-relaxed select-text border-t pt-1.5">
                                {customFooterText}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Launch print process button */}
                    <button
                      onClick={triggerPrintReceipt}
                      className="btn w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 border-none shadow-md"
                    >
                      <Printer className="w-4 h-4 text-white" />
                      Apply Layout &amp; Print Slip
                    </button>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="text-center py-20 px-4 text-slate-400 space-y-3 font-mono">
              <Info className="w-7 h-7 mx-auto opacity-30 text-slate-500" />
              <p className="text-xs">No Invoice Selected</p>
              <p className="text-[10px] leading-relaxed text-slate-500">
                Pick any row from the left general register list to inspect billing items, apply custom discounts, tweak shipping fees, or record deposits easily.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

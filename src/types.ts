/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PackItem {
  id: string;
  hblNo: string;
  description: string;
  qty: number;
  cc: string; // Customs Code
  dangerGood: boolean;
  boxPosition: string; // C/P (Custom Position/Placement)
  netKg: number;
  grossKg: number;
  totalKg: number;
  cbm: number;
  unitPriceYen: number;
  totalYen: number;
}

export interface Declaration {
  id: string; // Unique Tracking Index
  hblNo: string;
  status: 'Approved' | 'Pending' | 'Declined';
  declineReason?: string;
  dateSubmitted: string;
  approvedBy?: string;

  // Sender (Shipper in Japan)
  senderName: string;
  senderAddr: string;
  senderIdNum: string;
  senderTel: string;
  senderEmail: string;

  // Receiver (Consignee in Sri Lanka)
  receiverName: string;
  receiverAddr: string;
  receiverIdNum: string;
  receiverTel: string;
  receiverEmail: string;
  receiverIdPhoto?: string; // Data URL or placement

  // Package Overview
  boxCount: number;
  totalGrossWtKg: number;
  totalCbm: number;
  itemDescriptionList: string;
  specialNotes?: string;
  packagePhotos?: string[];

  // Delivery Setting
  deliveryType: 'D2D' | 'UPB'; // Door to Door, Unaccompanied Personal Baggage
  deliveryAddress: string;
  destinationWarehouse: string;
  agentHbl: string;

  // Invoice / Bills
  cbmRateYen: number;
  cbmQty: number;
  handlingFeeYen: number;
  insuranceYen: number;
  otherChargesYen: number;
  discountYen: number;
  totalBillYen: number;
  paidAmountYen: number;

  // Signatures
  senderSignature?: string; // Data URL / signature image
  senderSignatureDate?: string;
  agentSignature?: string;
  agentSignatureDate?: string;
}

export interface ContainerBatch {
  id: string; // e.g. SJP1, SJP2
  containerNo: string;
  vesselName: string;
  etd: string;
  eta: string;
  status: 'Draft' | 'Loading' | 'In transit' | 'Delivered';
  declarationsList: string[]; // List of declaration HBL numbers within this container
}

export interface BillInvoice {
  id: string;
  declarationId: string;
  hblNo: string;
  customerName: string;
  amountYen: number;
  paidYen: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  dateIssued: string;
}

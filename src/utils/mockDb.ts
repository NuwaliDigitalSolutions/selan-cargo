/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Declaration, ContainerBatch, BillInvoice } from '../types';

const STORAGE_KEYS = {
  DECLARATIONS: 'seacargo_declarations',
  BATCHES: 'seacargo_batches',
};

const DEFAULT_DECLARATIONS: Declaration[] = [
  {
    id: 'SC-L6X7Y3',
    hblNo: 'HBL-0142',
    status: 'Approved',
    dateSubmitted: '2026-05-20',
    approvedBy: 'Admin Team',
    senderName: 'Sunil Fukuoka',
    senderAddr: 'Fukuoka, Japan',
    senderIdNum: 'JP-1029304',
    senderTel: '+81 90-1234-5678',
    senderEmail: 'sunil@fukuoka.net',
    receiverName: 'Dilani Perera',
    receiverAddr: 'Colombo, Sri Lanka',
    receiverIdNum: '19929341234V',
    receiverTel: '+94 77-123-4567',
    receiverEmail: 'dilani@perera.lk',
    boxCount: 2,
    totalGrossWtKg: 45.5,
    totalCbm: 1.8,
    itemDescriptionList: 'Clothing ×2, Toys ×1',
    specialNotes: 'Fragile collection of kids toys. Handle with care.',
    deliveryType: 'D2D',
    deliveryAddress: 'Wijerama Road, Colombo 07',
    destinationWarehouse: 'Colombo Warehouse',
    agentHbl: 'AGT-84931',
    cbmRateYen: 12000,
    cbmQty: 1.8,
    handlingFeeYen: 2000,
    insuranceYen: 1500,
    otherChargesYen: 0,
    discountYen: 600,
    totalBillYen: 24500,
    paidAmountYen: 24500,
  },
  {
    id: 'SC-K2F4H9',
    hblNo: 'HBL-0141',
    status: 'Declined',
    declineReason: 'Prohibited items found (unauthorized electrical appliance/lithium cells).',
    dateSubmitted: '2026-05-18',
    approvedBy: 'Customs Officer',
    senderName: 'Tanaka Hirohito',
    senderAddr: 'Tokyo, Shinjuku',
    senderIdNum: 'JP-3849204',
    senderTel: '+81 80-2345-6789',
    senderEmail: 'tanaka@shinjuku.jp',
    receiverName: 'Nuwan Silva',
    receiverAddr: 'Kandy, Sri Lanka',
    receiverIdNum: '198538294101',
    receiverTel: '+94 71-456-7890',
    receiverEmail: 'silva@kandy.org',
    boxCount: 3,
    totalGrossWtKg: 35.0,
    totalCbm: 0.9,
    itemDescriptionList: 'Books ×3, Electric Heater ×1, Stationery',
    specialNotes: 'Contains electric heater which requires supplementary excise approval.',
    deliveryType: 'UPB',
    deliveryAddress: '',
    destinationWarehouse: 'Kandy Warehouse',
    agentHbl: 'AGT-02391',
    cbmRateYen: 12000,
    cbmQty: 0.9,
    handlingFeeYen: 2000,
    insuranceYen: 1000,
    otherChargesYen: 0,
    discountYen: 1700,
    totalBillYen: 12100,
    paidAmountYen: 5000,
  },
  {
    id: 'SC-M8D2X9',
    hblNo: 'HBL-0140',
    status: 'Approved',
    dateSubmitted: '2026-05-15',
    approvedBy: 'Admin Team',
    senderName: 'Yamamoto Kenji',
    senderAddr: 'Osaka, Umeda',
    senderIdNum: 'JP-8374921',
    senderTel: '+81 90-8888-9999',
    senderEmail: 'yamamoto@umeda.jp',
    receiverName: 'Chamari Fernando',
    receiverAddr: 'Gampaha, Sri Lanka',
    receiverIdNum: '199538492011',
    receiverTel: '+94 75-999-8888',
    receiverEmail: 'chamari@gampaha.lk',
    boxCount: 4,
    totalGrossWtKg: 68.2,
    totalCbm: 2.1,
    itemDescriptionList: 'Cosmetics ×4, Clothing ×3',
    specialNotes: 'Gift perfumes included inside cosmetics box.',
    deliveryType: 'D2D',
    deliveryAddress: 'Negombo Road, Gampaha',
    destinationWarehouse: 'Colombo Warehouse',
    agentHbl: 'AGT-10294',
    cbmRateYen: 13000,
    cbmQty: 2.1,
    handlingFeeYen: 3000,
    insuranceYen: 2500,
    otherChargesYen: 0,
    discountYen: 1600,
    totalBillYen: 31200,
    paidAmountYen: 0,
  },
  {
    id: 'SC-A4R3S2',
    hblNo: 'HBL-0139',
    status: 'Approved',
    dateSubmitted: '2026-05-12',
    approvedBy: 'Admin Team',
    senderName: 'Kobayashi Takeshi',
    senderAddr: 'Kyoto, Japan',
    senderIdNum: 'JP-0928302',
    senderTel: '+81 75-394-0192',
    senderEmail: 'takeshi@kobayashi.pref',
    receiverName: 'Weerasinghe P.',
    receiverAddr: 'Galle, Sri Lanka',
    receiverIdNum: '198894039403',
    receiverTel: '+94 91-456-0294',
    receiverEmail: 'weera@galle.com',
    boxCount: 1,
    totalGrossWtKg: 24.5,
    totalCbm: 1.5,
    itemDescriptionList: 'Cooking utensils ×5, Tea pots',
    deliveryType: 'D2D',
    deliveryAddress: 'Galle Fort Road, Galle',
    destinationWarehouse: 'Galle Warehouse',
    agentHbl: 'AGT-20394',
    cbmRateYen: 11500,
    cbmQty: 1.5,
    handlingFeeYen: 1500,
    insuranceYen: 1000,
    otherChargesYen: 1000,
    discountYen: 2000,
    totalBillYen: 18750,
    paidAmountYen: 18750,
  },
  {
    id: 'SC-L9T4G1',
    hblNo: 'HBL-0138',
    status: 'Approved',
    dateSubmitted: '2026-05-10',
    approvedBy: 'Admin Team',
    senderName: 'Sato Lily',
    senderAddr: 'Sapporo, Hokkaido',
    senderIdNum: 'JP-9018401',
    senderTel: '+81 11-304-1029',
    senderEmail: 'sato@sapporo.co.jp',
    receiverName: 'Gunawardena R.',
    receiverAddr: 'Panadura, Western Province',
    receiverIdNum: '199182940294',
    receiverTel: '+94 38-920-3029',
    receiverEmail: 'gunawardena@panadura.lk',
    boxCount: 1,
    totalGrossWtKg: 10.0,
    totalCbm: 0.9,
    itemDescriptionList: 'Premium Chocolates ×5, Warm Blankets ×2',
    deliveryType: 'D2D',
    deliveryAddress: 'Main Street, Panadura',
    destinationWarehouse: 'Colombo Warehouse',
    agentHbl: 'AGT-38491',
    cbmRateYen: 9500,
    cbmQty: 0.9,
    handlingFeeYen: 1000,
    insuranceYen: 500,
    otherChargesYen: 0,
    discountYen: 650,
    totalBillYen: 9400,
    paidAmountYen: 9400,
  },
  {
    id: 'SC-Y7U2B3',
    hblNo: 'HBL-0134',
    status: 'Approved',
    dateSubmitted: '2026-05-08',
    approvedBy: 'Admin Team',
    senderName: 'Yoshida Minoru',
    senderAddr: 'Nagoya, Aichi',
    senderIdNum: 'JP-2938495',
    senderTel: '+81 52-948-3842',
    senderEmail: 'yoshida@aichi.net',
    receiverName: 'Karunaratne S.',
    receiverAddr: 'Negombo, Sri Lanka',
    receiverIdNum: '197940294018',
    receiverTel: '+94 31-294-1029',
    receiverEmail: 'karu@negombo.lk',
    boxCount: 2,
    totalGrossWtKg: 30.5,
    totalCbm: 1.2,
    itemDescriptionList: 'Fishing Gear ×2, Waterproof clothing',
    deliveryType: 'UPB',
    deliveryAddress: '',
    destinationWarehouse: 'Colombo Warehouse',
    agentHbl: 'AGT-04921',
    cbmRateYen: 11000,
    cbmQty: 1.2,
    handlingFeeYen: 1500,
    insuranceYen: 1000,
    otherChargesYen: 0,
    discountYen: 1300,
    totalBillYen: 14400,
    paidAmountYen: 14400,
  },
  {
    id: 'SC-W4N1P5',
    hblNo: 'HBL-0132',
    status: 'Approved',
    dateSubmitted: '2026-05-05',
    approvedBy: 'Admin Team',
    senderName: 'Suzuki Akira',
    senderAddr: 'Yokohama, Kanagawa',
    senderIdNum: 'JP-1928304',
    senderTel: '+81 45-203-9402',
    senderEmail: 'suzuki@yokohama.jp',
    receiverName: 'Jayasinghe M.',
    receiverAddr: 'Jaffna, Sri Lanka',
    receiverIdNum: '198730492801',
    receiverTel: '+94 21-394-1029',
    receiverEmail: 'jaya@jaffna.co',
    boxCount: 3,
    totalGrossWtKg: 55.4,
    totalCbm: 2.4,
    itemDescriptionList: 'Automobile spare parts (non-commercial)',
    deliveryType: 'D2D',
    deliveryAddress: 'Hospital Road, Jaffna',
    destinationWarehouse: 'Jaffna Warehouse',
    agentHbl: 'AGT-90234',
    cbmRateYen: 12000,
    cbmQty: 2.4,
    handlingFeeYen: 2000,
    insuranceYen: 1500,
    otherChargesYen: 1000,
    discountYen: 1200,
    totalBillYen: 32100,
    paidAmountYen: 32100,
  }
];

const DEFAULT_BATCHES: ContainerBatch[] = [
  {
    id: 'SJP1',
    containerNo: 'TCNU1234567',
    vesselName: 'MSC BEATRICE',
    etd: '2026-05-25',
    eta: '2026-06-12',
    status: 'In transit',
    declarationsList: ['HBL-0142', 'HBL-0140', 'HBL-0134']
  },
  {
    id: 'SJP2',
    containerNo: 'MSCU7890123',
    vesselName: 'EVER GIVEN II',
    etd: '2026-06-10',
    eta: '2026-06-28',
    status: 'Loading',
    declarationsList: ['HBL-0139', 'HBL-0138']
  },
  {
    id: 'SJP3',
    containerNo: '—',
    vesselName: 'Draft Loader',
    etd: '2026-07-05',
    eta: '2026-07-23',
    status: 'Draft',
    declarationsList: ['HBL-0132']
  },
  {
    id: 'SJP0',
    containerNo: 'HLCU0001234',
    vesselName: 'COSCO PRIDE',
    etd: '2026-04-10',
    eta: '2026-04-28',
    status: 'Delivered',
    declarationsList: []
  }
];

export function getDeclarations(): Declaration[] {
  const data = localStorage.getItem(STORAGE_KEYS.DECLARATIONS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.DECLARATIONS, JSON.stringify(DEFAULT_DECLARATIONS));
    return DEFAULT_DECLARATIONS;
  }
  return JSON.parse(data);
}

export function saveDeclarations(decls: Declaration[]) {
  localStorage.setItem(STORAGE_KEYS.DECLARATIONS, JSON.stringify(decls));
}

export function addDeclaration(decl: Declaration) {
  const decls = getDeclarations();
  decls.unshift(decl);
  saveDeclarations(decls);
}

export function updateDeclarationStatus(id: string, status: 'Approved' | 'Declined', reason?: string) {
  const decls = getDeclarations();
  const index = decls.findIndex(d => d.id === id);
  if (index !== -1) {
    decls[index].status = status;
    if (reason) decls[index].declineReason = reason;
    decls[index].approvedBy = 'System Admin';
    saveDeclarations(decls);
  }
}

export function getBatches(): ContainerBatch[] {
  const data = localStorage.getItem(STORAGE_KEYS.BATCHES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(DEFAULT_BATCHES));
    return DEFAULT_BATCHES;
  }
  return JSON.parse(data);
}

export function saveBatches(batches: ContainerBatch[]) {
  localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
}

export function addBatch(batch: ContainerBatch) {
  const batches = getBatches();
  batches.push(batch);
  saveBatches(batches);
}

export function getBillInvoices(): BillInvoice[] {
  const decls = getDeclarations();
  return decls.map((d, index) => {
    let billStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
    if (d.paidAmountYen >= d.totalBillYen) {
      billStatus = 'Paid';
    } else if (d.paidAmountYen > 0) {
      billStatus = 'Partial';
    }

    return {
      id: `BILL-00${52 - index}`,
      declarationId: d.id,
      hblNo: d.hblNo,
      customerName: d.senderName,
      amountYen: d.totalBillYen,
      paidYen: d.paidAmountYen,
      status: billStatus,
      dateIssued: d.dateSubmitted,
    };
  });
}

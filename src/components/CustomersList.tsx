/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Users, Search, QrCode, Mail, Phone, MapPin, Layers } from 'lucide-react';
import { Declaration } from '../types';

interface CustomersListProps {
  declarations: Declaration[];
  onOpenSticker: (hbl: string, sender: string, receiver: string, dest: string, items: string, type: 'D2D' | 'UPB') => void;
}

export default function CustomersList({ declarations, onOpenSticker }: CustomersListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Extract distinct shippers by name
  const shippersMap: { [name: string]: {
    name: string;
    addr: string;
    tel: string;
    email: string;
    decls: Declaration[];
    totalCbm: number;
    totalBoxes: number;
    methods: string[];
  }} = {};

  declarations.forEach(d => {
    const key = d.senderName.trim().toLowerCase();
    if (!shippersMap[key]) {
      shippersMap[key] = {
        name: d.senderName,
        addr: d.senderAddr,
        tel: d.senderTel,
        email: d.senderEmail,
        decls: [],
        totalCbm: 0,
        totalBoxes: 0,
        methods: []
      };
    }
    shippersMap[key].decls.push(d);
    shippersMap[key].totalCbm += d.totalCbm;
    shippersMap[key].totalBoxes += d.boxCount;
    if (!shippersMap[key].methods.includes(d.deliveryType)) {
      shippersMap[key].methods.push(d.deliveryType);
    }
  });

  const shippers = Object.values(shippersMap);

  const filteredShippers = shippers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.addr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.tel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Registered Shippers &amp; Customers Directory
          </h2>
          <p className="text-xs text-slate-500 font-medium">Customer directory loaded from global declarations.</p>
        </div>

        {/* --- Searching lookup --- */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search shipper directory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        {filteredShippers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-1">
            <Users className="w-8 h-8 mx-auto opacity-30 text-slate-500" />
            <p className="text-xs font-semibold">No customers registered yet.</p>
            <p className="text-[11px] text-slate-500">Go to New Declaration wizard to create shipper-consignee entries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-700 text-slate-500 uppercase text-[10.5px] tracking-wider">
                  <th className="py-3 px-4">Shipper Name</th>
                  <th className="py-3 px-3">Contact Information</th>
                  <th className="py-3 px-3">Japan Location</th>
                  <th className="py-3 px-3 text-center">Declared Bills</th>
                  <th className="py-3 px-3 text-center">Cumulative Box-Count</th>
                  <th className="py-3 px-3 text-center">Allocated CBM</th>
                  <th className="py-3 px-3 text-center">Methods</th>
                  <th className="py-3 px-4 text-center">Track Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                {filteredShippers.map((cust) => (
                  <tr key={cust.name} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {cust.name}
                    </td>
                    <td className="py-4 px-3 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cust.tel}</span>
                      </div>
                      {cust.email && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cust.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-3 text-slate-500 max-w-[150px] truncate" title={cust.addr}>
                      {cust.addr}
                    </td>
                    <td className="py-4 px-3 text-center font-bold text-slate-900 dark:text-slate-200">
                      {cust.decls.length}
                    </td>
                    <td className="py-4 px-3 text-center font-medium">
                      {cust.totalBoxes} cartons
                    </td>
                    <td className="py-4 px-3 text-center font-mono font-medium text-blue-600 dark:text-blue-400">
                      {cust.totalCbm.toFixed(2)} m³
                    </td>
                    <td className="py-4 px-3 text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {cust.methods.map(m => (
                          <span key={m} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            m === 'D2D' 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {cust.decls.map(decl => (
                          <button
                            key={decl.id}
                            onClick={() => onOpenSticker(
                              decl.hblNo,
                              decl.senderName,
                              decl.receiverName,
                              decl.receiverAddr,
                              decl.itemDescriptionList,
                              decl.deliveryType
                            )}
                            className="bg-blue-600 hover:bg-blue-700 mr-1 text-[10.5px] font-mono text-white px-2 py-1 rounded inline-flex items-center gap-1 shrink-0"
                            title={`Generate sticker for ${decl.hblNo}`}
                          >
                            <QrCode className="w-3 h-3" />
                            <span>{decl.hblNo}</span>
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

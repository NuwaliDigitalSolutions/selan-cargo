/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { QrCode, Printer, Download, Share2, Ship, Info } from 'lucide-react';
import { drawQR, openStickerPrintWindow } from '../utils/qr';

interface StickerGeneratorProps {
  initialData?: {
    hbl: string;
    sender: string;
    receiver: string;
    dest: string;
    items: string;
    type: 'D2D' | 'UPB';
    telephone?: string;
  } | null;
}

export default function StickerGenerator({ initialData }: StickerGeneratorProps = {}) {
  const [hblCode, setHblCode] = useState(initialData?.hbl || 'HBL-0143');
  const [senderName, setSenderName] = useState(initialData?.sender || 'John Doe');
  const [receiverName, setReceiverName] = useState(initialData?.receiver || 'Devinda Silva');
  const [destAddress, setDestAddress] = useState(initialData?.dest || 'Galle Port Road, Galle');
  const [telephone, setTelephone] = useState(initialData?.telephone || '+94 77-111-2222');
  const [items, setItems] = useState(initialData?.items || 'Hand blender ×1, Clothes, Shoes');
  const [deliveryType, setDeliveryType] = useState<'D2D' | 'UPB'>(initialData?.type || 'D2D');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const uid = 'SC-' + hblCode.replace('HBL-', '');

  useEffect(() => {
    if (initialData) {
      setHblCode(initialData.hbl);
      setSenderName(initialData.sender);
      setReceiverName(initialData.receiver);
      setDestAddress(initialData.dest);
      setItems(initialData.items);
      setDeliveryType(initialData.type);
      if (initialData.telephone) {
        setTelephone(initialData.telephone);
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (canvasRef.current) {
      const trackUrl = `https://seacargo.jp/track/${uid}`;
      drawQR(canvasRef.current, trackUrl);
    }
  }, [uid]);

  const handleShare = () => {
    const text = `*Sea Cargo Label Sticker*
HBL: ${hblCode}
UID Reference: ${uid}
Sender: ${senderName}
Receiver: ${receiverName}
Delivery: ${deliveryType}
Items list: ${items}
Track live: https://seacargo.jp/track/${uid}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          QR Sticker Label Generator
        </h2>
        <p className="text-xs text-slate-500">Design and print customized tracking codes for independent boxes on demand.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* --- DESIGNS INPUT CARD --- */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4 text-left">
          <h3 className="text-sm font-bold border-b pb-2 text-slate-850 dark:text-slate-100 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            Label Specifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">HBL House Bill Code</label>
              <input 
                type="text" 
                value={hblCode}
                onChange={(e) => setHblCode(e.target.value)}
                placeholder="e.g. HBL-0143"
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Delivery Category</label>
              <select 
                value={deliveryType} 
                onChange={(e) => setDeliveryType(e.target.value as 'D2D' | 'UPB')}
                className="w-full text-xs"
              >
                <option value="D2D">D2D — Home Delivery Address</option>
                <option value="UPB">UPB — Port Warehouse Pickup</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Shipper Full Name</label>
              <input 
                type="text" 
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Shipper full name"
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Consignee Full Name</label>
              <input 
                type="text" 
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Receiver full name"
                className="w-full text-xs"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Delivery / Bonded Address destination</label>
              <input 
                type="text" 
                value={destAddress}
                onChange={(e) => setDestAddress(e.target.value)}
                placeholder="City, district, road etc."
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">WhatsApp / SMS Contact</label>
              <input 
                type="text" 
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="+94 ..."
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Carton Box Items</label>
              <input 
                type="text" 
                value={items}
                onChange={(e) => setItems(e.target.value)}
                placeholder="e.g. Clothing"
                className="w-full text-xs"
              />
            </div>
          </div>
          <p className="text-[10.5px] text-slate-400 leading-normal bg-slate-50 dark:bg-slate-900/35 p-3 rounded-lg">
            This tracking label can be printed directly via zebra label printers on 4&quot;x6&quot; adhesive papers or exported as clean vectors.
          </p>
        </div>

        {/* --- STICKER PREVIEW SECTION --- */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm text-center">
            <h3 className="text-xs font-semibold text-slate-400 uppercase block mb-4 tracking-wider">Visual Sticker Preview</h3>
            
            <div className="flex items-center justify-center p-3 bg-slate-100 dark:bg-slate-900/50 rounded-xl">
              {/* Box container */}
              <div 
                className="w-full max-w-[365px] bg-white text-slate-900 border-[3px] border-slate-950 rounded-lg overflow-hidden shadow-md font-sans text-left"
              >
                <div className="bg-blue-800 text-white px-3.5 py-2.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Ship className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                    Sea Cargo — Japan → SL
                  </span>
                  <span className="text-[9.5px] font-mono font-extrabold bg-blue-900 px-2 py-0.5 rounded border border-blue-700">
                    {uid}
                  </span>
                </div>
                <div className="p-3.5 flex gap-3 text-left">
                  {/* Canvas QR Code */}
                  <div className="shrink-0 flex items-center justify-center bg-white border p-1 rounded">
                    <canvas ref={canvasRef} width="96" height="96" className="w-24 h-24" />
                  </div>
                  {/* Decrypted Fields */}
                  <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Sender</span>
                      <span className="font-semibold text-slate-850 truncate block" title={senderName}>{senderName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Receiver</span>
                      <span className="font-semibold text-slate-850 truncate block" title={receiverName}>{receiverName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Destination Address</span>
                      <span className="font-semibold text-slate-800 text-[10.5px] leading-tight block truncate" title={destAddress}>
                        {destAddress || '—'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Contact</span>
                        <span className="font-semibold">{telephone || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">HBL No.</span>
                        <span className="font-bold text-blue-700 font-mono text-[10.5px]">{hblCode || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50 p-2.5 text-left text-xs">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Declared Items</span>
                  <span className="text-slate-700 font-medium text-[11px] leading-tight block truncate">
                    {items || 'Mixed personal personal effects.'}
                  </span>
                </div>

                <div className="bg-blue-800 text-white text-[8px] font-bold tracking-wider text-center p-1.5 uppercase select-none">
                  SCAN QR CODE TO TRACK PARCEL STATUS IN REAL TIME
                </div>
              </div>
            </div>
          </div>

          {/* Trigger controls */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => openStickerPrintWindow(
                uid,
                senderName,
                receiverName,
                destAddress,
                telephone,
                hblCode,
                items,
                canvasRef.current?.toDataURL() || ''
              )}
              className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 px-4"
            >
              <Printer className="w-4 h-4" />
              Print Sticker Label
            </button>
            <button
              onClick={() => {
                const dataUrl = canvasRef.current?.toDataURL() || '';
                openStickerPrintWindow(
                  uid,
                  senderName,
                  receiverName,
                  destAddress,
                  telephone,
                  hblCode,
                  items,
                  dataUrl,
                  true
                );
              }}
              className="btn hover:bg-slate-50 text-slate-700 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download PDF Form
            </button>
            <button
              onClick={handleShare}
              className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
            >
              <Share2 className="w-4 h-4" />
              Share WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

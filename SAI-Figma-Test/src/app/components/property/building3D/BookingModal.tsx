import React, { useState } from "react";
import { Unit3DItem, bookUnit, BookingResponse } from "../../../../api/building3D";
import {
  X,
  CheckCircle,
  AlertTriangle,
  Zap,
  Building,
  Layers,
  Compass,
  CreditCard,
  Lock,
  ArrowRight
} from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit3DItem;
  projectName: string;
  towerName: string;
  onBookingSuccess: (response: BookingResponse) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  unit,
  projectName,
  towerName,
  onBookingSuccess,
}) => {
  const [buyerName, setBuyerName] = useState("Kunal Deshmukh");
  const [buyerEmail, setBuyerEmail] = useState("kunal.buyer@saiurban.com");
  const [buyerPhone, setBuyerPhone] = useState("9822054321");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingResponse | null>(null);

  if (!isOpen) return null;

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await bookUnit({
        unit_id: unit.id,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone,
        booking_amount: 50000.0,
        payment_method: paymentMethod,
        notes: `Direct flat booking from SAI 3D Discovery: ${unit.unit_label || unit.unit_number}`,
      });

      setConfirmedBooking(response);
      onBookingSuccess(response);
    } catch (err: any) {
      const detail = err?.message || err?.detail || "Booking failed.";
      setErrorMessage(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        {confirmedBooking ? (
          /* Confirmation Success Screen */
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle size={32} />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">Flat Booking Confirmed!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Booking Reference #{confirmedBooking.booking.id} · Transaction verified in database
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Project / Tower:</span>
                <span className="font-bold text-white">{projectName} · {towerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Flat Number:</span>
                <span className="font-bold text-teal-300">{confirmedBooking.booking.unit_label}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Floor & Direction:</span>
                <span className="font-semibold text-slate-300">Floor {confirmedBooking.booking.floor_number} · {confirmedBooking.booking.direction} Facing</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Agreed Price:</span>
                <span className="font-bold text-white">{confirmedBooking.booking.price_display}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Token Amount Paid:</span>
                <span className="font-bold text-emerald-400">{confirmedBooking.booking.booking_amount_display}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl transition-colors cursor-pointer"
            >
              Done & Return to Building
            </button>
          </div>
        ) : (
          /* Confirmation Form */
          <div>
            <div className="mb-4">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Zap className="text-teal-400" size={18} />
                Confirm Flat Reservation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review your selected apartment details. Reservation will lock the flat atomically.
              </p>
            </div>

            {/* Flat Spec Summary */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4 text-xs space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-400">Project:</span>
                <span className="text-white font-bold">{projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tower:</span>
                <span className="text-white font-bold">{towerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Floor:</span>
                <span className="text-white font-bold">{unit.floor_number}th Floor</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Flat:</span>
                <span className="text-teal-300 font-black">{unit.unit_label || `${unit.floor_number}-${unit.unit_number}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Configuration:</span>
                <span className="text-white">{unit.bhk} BHK · {unit.carpet_area} sq.ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Direction:</span>
                <span className="text-white">{unit.direction} Facing (Balcony: {unit.balcony_direction})</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-bold">Total Price:</span>
                <span className="text-teal-300 font-black text-sm">{unit.price_display}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Booking Token:</span>
                <span className="text-emerald-400 font-black text-sm">₹50,000</span>
              </div>
            </div>

            {/* Conflict / Race Condition Warning */}
            {errorMessage && (
              <div className="bg-rose-950/60 border border-rose-600/50 rounded-2xl p-3.5 mb-4 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-rose-200">Booking Unsuccessful</p>
                  <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Buyer Contact Form */}
            <form onSubmit={handleConfirmBooking} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Phone Number
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-xs font-bold text-slate-500 select-none pointer-events-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      required
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9822054321"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Payment Mode for Token (₹50,000)
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="upi">UPI / Instant Bank Transfer</option>
                  <option value="netbanking">Net Banking (HDFC / ICICI / SBI)</option>
                  <option value="card">Debit / Credit Card</option>
                  <option value="cheque">Bank Demand Draft / Cheque</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Lock size={13} />
                  <span>{loading ? "Locking Flat..." : "CONFIRM BOOKING"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

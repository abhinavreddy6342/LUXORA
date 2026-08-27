import { useState } from "react";
import { Truck, CheckCircle2, MapPin } from "lucide-react";

function DeliveryEstimator() {
  const [pincode, setPincode] = useState("");
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState("");

  const handleCheck = (e) => {
    e.preventDefault();
    const clean = pincode.replace(/\D/g, "").slice(0, 6);

    if (clean.length !== 6) {
      setError("Please enter a valid 6-digit PIN code.");
      setEstimate(null);
      return;
    }

    setError("");

    // Calculate delivery date (3-5 days from today)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 3);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 6);

    const options = { day: "numeric", month: "short" };
    const startStr = startDate.toLocaleDateString("en-IN", options);
    const endStr = endDate.toLocaleDateString("en-IN", options);

    setEstimate({
      pincode: clean,
      dateRange: `${startStr} – ${endStr}`,
    });
  };

  return (
    <div className="border border-black/10 bg-white p-5 my-6">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.1em] mono">
        <Truck size={15} strokeWidth={1.5} />
        DELIVERY ESTIMATE
      </div>

      <form onSubmit={handleCheck} className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <MapPin
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setError("");
            }}
            placeholder="Enter 6-digit PIN Code"
            className="w-full border border-black/15 bg-white pl-9 pr-3 py-2.5 text-xs outline-none focus:border-black transition-colors"
          />
        </div>

        <button
          type="submit"
          className="mono bg-black px-4 py-2.5 text-[9px] font-semibold tracking-[0.15em] text-white hover:bg-neutral-800 transition-colors"
        >
          CHECK
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-rose-600 font-medium">{error}</p>}

      {estimate && (
        <div className="mt-4 border-t border-black/10 pt-3">
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
            <CheckCircle2 size={14} />
            <span>Delivery available for {estimate.pincode}</span>
          </div>

          <p className="mt-1 text-xs text-neutral-600">
            Estimated delivery:{" "}
            <span className="font-semibold text-black">{estimate.dateRange}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default DeliveryEstimator;

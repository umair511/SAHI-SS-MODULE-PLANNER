import React, { useState } from 'react';
import { 
  Cpu, 
  Disc, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  FileText, 
  ArrowRight, 
  RotateCcw, 
  Eye,
  Sliders,
  Trash2
} from 'lucide-react';
import { VA05Order, UserProfile } from '../../types';
import { JumboRoll, MetallizerMachineSettings, MetallizerPlan } from '../../types/metallizer';
import { isMetallizerOrder, generateMetallizerPlans } from '../../services/metallizer/metallizerOptimizer';
import { fetchMetallizerPlansAsync } from '../../services/metallizer/metallizerApi';
import { 
  saveStoredMetallizerPlans, 
  saveStoredJumboRolls, 
  getStoredMetallizerPlans, 
  getStoredJumboRolls 
} from '../../services/metallizer/metallizerStorage';
import { saveStoredOrders } from '../../services/storage';

interface MetallizerPlanningStudioProps {
  orders: VA05Order[];
  jumboRolls: JumboRoll[];
  plans: MetallizerPlan[];
  settings: MetallizerMachineSettings;
  currentUser: UserProfile;
  preselectedFilm?: string;
  onRunCommitted: (newPlans: MetallizerPlan[], updatedRolls: JumboRoll[], updatedOrders: VA05Order[]) => void;
  onOpenPlan: (plan: MetallizerPlan) => void;
}

export const MetallizerPlanningStudio: React.FC<MetallizerPlanningStudioProps> = ({
  orders,
  jumboRolls,
  plans,
  settings,
  currentUser,
  preselectedFilm = 'MZ18',
  onRunCommitted,
  onOpenPlan,
}) => {
  const [selectedFilm, setSelectedFilm] = useState<string>(preselectedFilm);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<{
    plans: MetallizerPlan[];
    remainingOrders: VA05Order[];
    updatedRolls: JumboRoll[];
  } | null>(null);

  // Available metallized grades (strictly orders with film code containing "MZ")
  const metallizedOrders = orders.filter(o => isMetallizerOrder(o));

  const availableFilms = Array.from(new Set(metallizedOrders.map(o => o.film))).sort();

  // Pending orders for selected film
  const filmOrders = orders.filter(o => o.film === selectedFilm && o.remaining_qty > 0);
  const filmPendingKg = filmOrders.reduce((sum, o) => sum + o.remaining_qty, 0);

  // Available jumbo rolls for selected film
  const availableRolls = jumboRolls.filter(r => 
    r.film === selectedFilm && 
    (r.status === 'AVAILABLE' || r.status === 'PARTIALLY_CONSUMED') && 
    r.remaining_length_m > 0
  );
  const availableStockKg = availableRolls.reduce((sum, r) => sum + r.remaining_quantity_kg, 0);

  const handleRunOptimizer = async () => {
    if (isOptimizing) return;
    if (availableRolls.length === 0) {
      alert(`No available physical jumbo rolls found in inventory for grade ${selectedFilm}. Please import or add jumbo rolls first.`);
      return;
    }
    if (filmOrders.length === 0) {
      alert(`No pending customer demand orders for film grade ${selectedFilm}.`);
      return;
    }

    setIsOptimizing(true);
    try {
      const result = generateMetallizerPlans(orders, jumboRolls, settings, selectedFilm);
      setPreviewResult(result);
    } catch (err) {
      console.error('Optimizer error:', err);
      alert('Error running slitter plan optimizer.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCommitRun = () => {
    if (!previewResult || previewResult.plans.length === 0) return;

    // Persist plans, rolls, and orders
    const allExistingPlans = getStoredMetallizerPlans();
    const mergedPlans = [...previewResult.plans, ...allExistingPlans];
    saveStoredMetallizerPlans(mergedPlans);

    saveStoredJumboRolls(previewResult.updatedRolls);
    saveStoredOrders(previewResult.remainingOrders);

    onRunCommitted(mergedPlans, previewResult.updatedRolls, previewResult.remainingOrders);
    setPreviewResult(null);
    alert(`Successfully committed ${previewResult.plans.length} Metallizer Slitter Plan(s)! Inventory consumption and order allocations updated.`);
  };

  return (
    <div className="space-y-6" id="msl-studio-view">
      {/* Studio Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm text-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-purple-950 text-purple-300 border border-purple-800">
              METALLIZER OPTIMIZER STUDIO
            </span>
            <span className="text-xs text-slate-400 font-mono">10" Steel Core · 3-UPS Target · 20–30mm Trim</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Intelligent Metallizer Slitter Planning Studio
          </h1>
          <p className="text-sm text-slate-400">
            Plans slit schedules against real consumable mother rolls with automatic diameter and trim enforcement
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunOptimizer}
            disabled={isOptimizing || availableRolls.length === 0 || filmOrders.length === 0}
            className="flex items-center space-x-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Cpu className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Optimizing Against Inventory...' : 'Generate Optimized MSL Plans'}</span>
          </button>
        </div>
      </div>

      {/* Grade Selector & Real-Time Context Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Target Film Grade
          </label>
          <select
            value={selectedFilm}
            onChange={(e) => {
              setSelectedFilm(e.target.value);
              setPreviewResult(null);
            }}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-bold text-purple-900 focus:ring-2 focus:ring-purple-500"
          >
            {availableFilms.map(film => (
              <option key={film} value={film}>
                {film} — Demand: {(orders.filter(o => o.film === film && o.remaining_qty > 0).reduce((s, o) => s + o.remaining_qty, 0) ?? 0).toLocaleString()} kg
              </option>
            ))}
          </select>
        </div>

        {/* Demand Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-col justify-center">
          <span className="text-slate-500 text-[11px] uppercase font-semibold">Active Customer Demand</span>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
            {(filmPendingKg ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">KG ({filmOrders.length} orders)</span>
          </div>
          <span className="text-[11px] text-slate-500">Sizes: {Array.from(new Set(filmOrders.map(o => o.width_mm))).join(', ')} mm</span>
        </div>

        {/* Physical Inventory Info */}
        <div className="bg-purple-50/60 border border-purple-200 rounded-lg p-3 text-xs flex flex-col justify-center">
          <span className="text-purple-800 text-[11px] uppercase font-semibold">Available Jumbo Roll Stock</span>
          <div className="text-lg font-black text-purple-900 font-mono mt-0.5">
            {(availableStockKg ?? 0).toLocaleString()} <span className="text-xs font-normal text-purple-700">KG ({availableRolls.length} rolls ready)</span>
          </div>
          <span className="text-[11px] text-purple-700">Roll Widths: {Array.from(new Set(availableRolls.map(r => r.width_mm))).join(', ')} mm</span>
        </div>
      </div>

      {/* Optimizer Preview / Output Section */}
      {previewResult && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border-2 border-purple-500 rounded-xl p-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800">
                  OPTIMIZATION COMPLETE
                </span>
                <span className="font-bold text-slate-900 text-base">
                  {previewResult.plans.length} Metallizer Plan(s) Ready for Commit
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Allocated against physical consumable rolls · Total Planned: <b className="text-slate-900 font-mono">{(previewResult.plans.reduce((s, p) => s + (p.planned_quantity_kg ?? 0), 0) ?? 0).toLocaleString()} kg</b>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewResult(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Discard Preview
              </button>
              <button
                onClick={handleCommitRun}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Commit Run & Consume Rolls</span>
              </button>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 gap-4">
            {previewResult.plans.map((plan, pIdx) => (
              <div key={plan.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-purple-100 text-purple-800 font-mono">
                        {plan.plan_number}
                      </span>
                      <span className="font-bold text-slate-900 text-base">
                        Film: {plan.film} ({plan.thickness_micron}µm)
                      </span>
                      <span className="px-2 py-0.5 text-xs font-bold bg-purple-600 text-white rounded">
                        Deckle: {plan.jumbo_width_mm} mm
                      </span>
                      <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                        {plan.ups} UPS
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center space-x-2">
                      <span>Consumed Mother Roll: <b className="text-purple-900 font-mono">{plan.jumbo_roll_id}</b></span>
                      <span>·</span>
                      <span>Diameter: <b className="text-slate-900 font-mono">{plan.diameter_mm} mm</b></span>
                      <span>·</span>
                      <span>Core: <b>{plan.core}</b></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Planned Weight</span>
                      <span className="font-mono font-black text-slate-900 text-sm">{(plan.planned_quantity_kg ?? 0).toLocaleString()} kg</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Trim Width</span>
                      <span className="font-mono font-black text-slate-900 text-sm">{plan.trim_mm} mm</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Trim Waste</span>
                      <span className="font-mono font-black text-emerald-700 text-sm">{plan.waste_percent}%</span>
                    </div>
                  </div>
                </div>

                {/* Knives Slit Pattern */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Slitter Knives Layout (Total Slit Width: {plan.total_slit_width_mm} mm + Trim: {plan.trim_mm} mm = {plan.jumbo_width_mm} mm):
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {plan.finished_sizes.map((sz, szIdx) => (
                      <div key={szIdx} className="bg-slate-100 border border-slate-300 px-3 py-2 rounded-lg flex items-center space-x-2">
                        <span className="text-slate-500 font-mono text-[10px]">Position {szIdx + 1}:</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">{sz} mm</span>
                      </div>
                    ))}
                    <div className="bg-purple-50 border border-purple-300 px-3 py-2 rounded-lg flex items-center space-x-2 text-purple-900">
                      <span className="text-[10px] uppercase font-semibold">Side Trim:</span>
                      <span className="font-mono font-bold text-sm">{plan.trim_mm} mm</span>
                    </div>
                  </div>
                </div>

                {/* Allocated Orders Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Customer Demand Allocations:
                  </h4>
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                      <tr>
                        <th className="py-2 px-3">SO #</th>
                        <th className="py-2 px-3">Customer</th>
                        <th className="py-2 px-3 text-right">Width</th>
                        <th className="py-2 px-3 text-right">Length</th>
                        <th className="py-2 px-3 text-right">UPS</th>
                        <th className="py-2 px-3 text-right">Reels</th>
                        <th className="py-2 px-3 text-right">Planned (KG)</th>
                        <th className="py-2 px-3 text-right">Remaining After</th>
                        <th className="py-2 px-3 text-center">Closure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {plan.orders_covered.map((o, oIdx) => (
                        <tr key={oIdx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{o.sales_order}-{o.item_number}</td>
                          <td className="py-2 px-3 font-medium text-slate-800 truncate max-w-xs">{o.customer}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">{o.width_mm} mm</td>
                          <td className="py-2 px-3 text-right font-mono">{(o.length_m ?? 0).toLocaleString()} m</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">{o.ups}</td>
                          <td className="py-2 px-3 text-right font-mono">{o.planned_reels}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-purple-700">{(o.planned_weight_kg ?? 0).toLocaleString()} kg</td>
                          <td className="py-2 px-3 text-right font-mono">{(o.remaining_after_kg ?? 0).toLocaleString()} kg</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              o.is_closed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {o.is_closed ? 'CLOSED' : 'PARTIAL'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two columns: Pending Orders Backlog & Available Jumbo Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders for Grade */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">
              Pending Orders — {selectedFilm} ({filmOrders.length})
            </h3>
            <span className="text-xs font-mono font-bold text-purple-700">
              {(filmPendingKg ?? 0).toLocaleString()} KG
            </span>
          </div>

          <div className="divide-y divide-slate-100 mt-2 max-h-96 overflow-y-auto pr-1">
            {filmOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No pending customer orders for {selectedFilm}.
              </div>
            ) : (
              filmOrders.map(order => (
                <div key={order.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900">{order.sales_order}-{order.item_number}</span>
                      <span className="text-slate-600 font-medium">{order.customer}</span>
                    </div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      Width: <b className="text-slate-800">{order.width_mm}mm</b> · Length: {(order.length_m ?? 0).toLocaleString()}m
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-purple-700">{(order.remaining_qty ?? 0).toLocaleString()} kg</div>
                    <span className="text-[10px] text-slate-400">Bal: {(order.balance_qty ?? 0).toLocaleString()} kg</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Available Jumbo Rolls for Grade */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">
              Ready Jumbo Rolls — {selectedFilm} ({availableRolls.length})
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {(availableStockKg ?? 0).toLocaleString()} KG
            </span>
          </div>

          <div className="divide-y divide-slate-100 mt-2 max-h-96 overflow-y-auto pr-1">
            {availableRolls.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No available jumbo rolls for {selectedFilm}. Add rolls in Jumbo Inventory.
              </div>
            ) : (
              availableRolls.map(roll => (
                <div key={roll.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900">{roll.roll_id}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded">
                        {roll.status}
                      </span>
                    </div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      Width: <b className="text-slate-800">{roll.width_mm}mm</b> · Length: {(roll.remaining_length_m ?? 0).toLocaleString()}m · Dia: {roll.diameter_mm}mm
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900">{(roll.remaining_quantity_kg ?? 0).toLocaleString()} kg</div>
                    <span className="text-[10px] text-slate-500">10" Core</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { PlanningRules, FilmMaster, UserProfile } from '../types';
import { FILM_MASTERS, DEFAULT_PLANNING_RULES } from '../services/masterData';
import { saveStoredRules, logAuditEvent } from '../services/storage';
import { Settings, ShieldCheck, Layers, Save, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface MastersRulesProps {
  rules: PlanningRules;
  currentUser: UserProfile;
  onRulesUpdated: (newRules: PlanningRules) => void;
  onOpenTests?: () => void;
}

export const MastersRules: React.FC<MastersRulesProps> = ({
  rules,
  currentUser,
  onRulesUpdated,
  onOpenTests,
}) => {
  const [formRules, setFormRules] = useState<PlanningRules>({ ...rules });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    saveStoredRules(formRules);
    onRulesUpdated(formRules);
    logAuditEvent(
      currentUser,
      'UPDATE',
      'PLANNING_RULES',
      formRules.version,
      `Updated machine rules: Deckle=${formRules.deckle_mm}mm, Trim=${formRules.min_trim_mm}-${formRules.max_trim_mm}mm, UPS=${formRules.min_ups}-${formRules.max_ups}`
    );
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    setFormRules({ ...DEFAULT_PLANNING_RULES });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>Machine Parameters & Master Data</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Primary Slitter machine constraints and BOPP film grade specifications (SRS Section 86).
          </p>
        </div>

        {currentUser.role !== 'VIEWER' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Factory Defaults</span>
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Rules</span>
            </button>
          </div>
        )}
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Machine parameters successfully updated and active for next optimization runs.</span>
        </div>
      )}

      {/* Grid: Machine Constraints & Film Masters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine Configuration */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Primary Slitter Parameters</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-600 font-semibold block mb-1">Total Deckle Width (mm):</label>
              <input
                type="number"
                value={formRules.deckle_mm}
                onChange={(e) => setFormRules({ ...formRules, deckle_mm: parseFloat(e.target.value) || 10400 })}
                disabled={currentUser.role === 'VIEWER'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-slate-50"
              />
              <span className="text-[10px] text-slate-400">Fixed BOPP Mill Roll web width (10,400 mm)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Min Trim (mm):</label>
                <input
                  type="number"
                  value={formRules.min_trim_mm}
                  onChange={(e) => setFormRules({ ...formRules, min_trim_mm: parseFloat(e.target.value) || 160 })}
                  disabled={currentUser.role === 'VIEWER'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-slate-50"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Max Trim (mm):</label>
                <input
                  type="number"
                  value={formRules.max_trim_mm}
                  onChange={(e) => setFormRules({ ...formRules, max_trim_mm: parseFloat(e.target.value) || 220 })}
                  disabled={currentUser.role === 'VIEWER'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Min Arms / UPS:</label>
                <input
                  type="number"
                  value={formRules.min_ups}
                  onChange={(e) => setFormRules({ ...formRules, min_ups: parseInt(e.target.value) || 3 })}
                  disabled={currentUser.role === 'VIEWER'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-slate-50"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Max Arms / UPS:</label>
                <input
                  type="number"
                  value={formRules.max_ups}
                  onChange={(e) => setFormRules({ ...formRules, max_ups: parseInt(e.target.value) || 16 })}
                  disabled={currentUser.role === 'VIEWER'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Full Repetition (m):</label>
                <input
                  type="number"
                  value={formRules.full_repetition_length_m}
                  onChange={(e) => setFormRules({ ...formRules, full_repetition_length_m: parseFloat(e.target.value) || 19500 })}
                  disabled={currentUser.role === 'VIEWER'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-slate-50"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Half Repetition (m):</label>
                <input
                  type="number"
                  value={formRules.half_repetition_length_m}
                  onChange={(e) => setFormRules({ ...formRules, half_repetition_length_m: parseFloat(e.target.value) || 9750 })}
                  disabled={currentUser.role === 'VIEWER'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Min Slit Width (mm):</label>
              <input
                type="number"
                value={formRules.min_slit_width_mm || 355}
                onChange={(e) => setFormRules({ ...formRules, min_slit_width_mm: parseFloat(e.target.value) || 355 })}
                disabled={currentUser.role === 'VIEWER'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-slate-50"
              />
              <span className="text-[10px] text-slate-400">PS hard physical limit: minimum allowable slit width (355 mm)</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs space-y-1.5 font-mono">
            <div className="text-emerald-400 font-bold font-sans">Primary Slitter Hard Constraints:</div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Total Deckle:</span>
              <span className="text-white font-bold">{formRules.deckle_mm} mm</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Valid Trim Window:</span>
              <span className="text-emerald-300 font-bold">{formRules.min_trim_mm} – {formRules.max_trim_mm} mm</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Valid Slit Window:</span>
              <span className="text-white font-bold">{formRules.deckle_mm - formRules.max_trim_mm} – {formRules.deckle_mm - formRules.min_trim_mm} mm</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Active Arms / UPS:</span>
              <span className="text-white font-bold">{formRules.min_ups} to {formRules.max_ups} Arms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Min Slit Width:</span>
              <span className="text-amber-300 font-bold">{formRules.min_slit_width_mm || 355} mm</span>
            </div>
          </div>

          {onOpenTests && (
            <button
              onClick={onOpenTests}
              className="w-full py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-800 hover:text-emerald-900 border border-emerald-500/50 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verify Machine Hard Rules (Test Suite)</span>
            </button>
          )}
        </div>

        {/* BOPP Film Master Catalog */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">BOPP Film Master Catalog ({FILM_MASTERS.length} Grades)</h3>
            </div>
            <span className="text-[11px] text-slate-500">Master Film Specifications</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Grade Code</th>
                  <th className="py-2.5 px-3">Film Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Thickness (µ)</th>
                  <th className="py-2.5 px-3 text-right">Density (g/cm³)</th>
                  <th className="py-2.5 px-3">Rej Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {FILM_MASTERS.map(film => (
                  <tr key={film.code} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-900 font-sans">{film.code}</td>
                    <td className="py-2 px-3 font-sans text-slate-700">{film.name}</td>
                    <td className="py-2 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {film.category}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{film.thickness_micron}</td>
                    <td className="py-2 px-3 text-right text-emerald-800 font-bold">{film.density}</td>
                    <td className="py-2 px-3 text-rose-700 font-bold text-[11px]">{film.rejection_code || film.rejection_material_code || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

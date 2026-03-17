import React, { useMemo } from 'react';
import { CapacityConfigState, CapacityDayConfig, DoctorShift } from '../types';
import { Clock, UserPlus, Calculator, AlertTriangle, CheckCircle2, Info, Plus, Trash2 } from 'lucide-react';
import { calculateStudiesInRange } from '../utils';

interface CapacityManagerProps {
  config: CapacityConfigState;
  onConfigChange: (config: CapacityConfigState) => void;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const CapacityManager: React.FC<CapacityManagerProps> = ({ config, onConfigChange }) => {
  const addDoctor = (day: string, period: 'morning' | 'afternoon') => {
    const newDoc: DoctorShift = {
      id: Math.random().toString(36).substr(2, 9),
      start: period === 'morning' ? '07:00' : '14:00',
      end: period === 'morning' ? '12:00' : '17:00',
      isDoppler: false
    };

    const newConfig = {
      ...config,
      [day]: {
        ...config[day],
        [`${period}Doctors`]: [...config[day][period === 'morning' ? 'morningDoctors' : 'afternoonDoctors'], newDoc]
      }
    };
    onConfigChange(newConfig);
  };

  const removeDoctor = (day: string, period: 'morning' | 'afternoon', id: string) => {
    const field = period === 'morning' ? 'morningDoctors' : 'afternoonDoctors';
    const newConfig = {
      ...config,
      [day]: {
        ...config[day],
        [field]: config[day][field].filter(d => d.id !== id)
      }
    };
    onConfigChange(newConfig);
  };

  const updateDoctor = (day: string, period: 'morning' | 'afternoon', id: string, field: keyof DoctorShift, value: any) => {
    const shiftField = period === 'morning' ? 'morningDoctors' : 'afternoonDoctors';
    const newConfig = {
      ...config,
      [day]: {
        ...config[day],
        [shiftField]: config[day][shiftField].map(d => d.id === id ? { ...d, [field]: value } : d)
      }
    };
    onConfigChange(newConfig);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <UserPlus className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-dark">Configuración de Médicos Adicionales (Ecografía)</h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Define disponibilidad adicional por jornada y médico</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-emerald-50 border border-brand-primary/10 p-4 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-brand-primary mt-0.5" />
          <div className="text-sm text-emerald-900">
            <p className="font-bold">Capacidad Base (Automática):</p>
            <p>De Lunes a Jueves se incluye automáticamente 1 médico (7:00 AM - 12:00 PM y 2:00 PM - 5:00 PM) con estudios cada 8 minutos.</p>
            <p className="mt-1">Usa los controles de abajo para agregar <strong>médicos adicionales</strong> por cada jornada. El tipo de estudio (Doppler) se define por médico.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {DAYS.map(day => (
            <div key={day} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-brand-dark text-lg">{day}</span>
              </div>

              {/* Morning Session */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jornada Mañana</span>
                  <button 
                    onClick={() => addDoctor(day, 'morning')}
                    className="flex items-center gap-1 px-2 py-1 bg-brand-primary text-white rounded-lg text-[10px] font-bold uppercase hover:bg-brand-primary/90 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Agregar Médico
                  </button>
                </div>
                
                <div className="space-y-3">
                  {config[day].morningDoctors.map((doc, idx) => (
                    <div key={doc.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Médico #{idx + 1}</span>
                        <button 
                          onClick={() => removeDoctor(day, 'morning', doc.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Inicio</label>
                          <input 
                            type="time" 
                            className="w-full text-xs p-1.5 border border-slate-100 rounded-lg bg-slate-50"
                            value={doc.start}
                            onChange={(e) => updateDoctor(day, 'morning', doc.id, 'start', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Fin</label>
                          <input 
                            type="time" 
                            className="w-full text-xs p-1.5 border border-slate-100 rounded-lg bg-slate-50"
                            value={doc.end}
                            onChange={(e) => updateDoctor(day, 'morning', doc.id, 'end', e.target.value)}
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input 
                          type="checkbox" 
                          className="rounded text-brand-primary focus:ring-brand-primary"
                          checked={doc.isDoppler}
                          onChange={(e) => updateDoctor(day, 'morning', doc.id, 'isDoppler', e.target.checked)}
                        />
                        <span className="text-[10px] font-bold text-brand-primary uppercase">Estudios Doppler (16 min)</span>
                      </label>
                    </div>
                  ))}
                  {config[day].morningDoctors.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic text-center py-2">Sin médicos adicionales en la mañana</p>
                  )}
                </div>
              </div>

              {/* Afternoon Session */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jornada Tarde</span>
                  <button 
                    onClick={() => addDoctor(day, 'afternoon')}
                    className="flex items-center gap-1 px-2 py-1 bg-brand-primary text-white rounded-lg text-[10px] font-bold uppercase hover:bg-brand-primary/90 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Agregar Médico
                  </button>
                </div>
                
                <div className="space-y-3">
                  {config[day].afternoonDoctors.map((doc, idx) => (
                    <div key={doc.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Médico #{idx + 1}</span>
                        <button 
                          onClick={() => removeDoctor(day, 'afternoon', doc.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Inicio</label>
                          <input 
                            type="time" 
                            className="w-full text-xs p-1.5 border border-slate-100 rounded-lg bg-slate-50"
                            value={doc.start}
                            onChange={(e) => updateDoctor(day, 'afternoon', doc.id, 'start', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Fin</label>
                          <input 
                            type="time" 
                            className="w-full text-xs p-1.5 border border-slate-100 rounded-lg bg-slate-50"
                            value={doc.end}
                            onChange={(e) => updateDoctor(day, 'afternoon', doc.id, 'end', e.target.value)}
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input 
                          type="checkbox" 
                          className="rounded text-brand-primary focus:ring-brand-primary"
                          checked={doc.isDoppler}
                          onChange={(e) => updateDoctor(day, 'afternoon', doc.id, 'isDoppler', e.target.checked)}
                        />
                        <span className="text-[10px] font-bold text-brand-primary uppercase">Estudios Doppler (16 min)</span>
                      </label>
                    </div>
                  ))}
                  {config[day].afternoonDoctors.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic text-center py-2">Sin médicos adicionales en la tarde</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

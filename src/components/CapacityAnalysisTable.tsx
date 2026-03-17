import React, { useMemo } from 'react';
import { Appointment, CapacityConfigState } from '../types';
import { getResourceGroup, calculateStudiesInRange, getRegistrationDate } from '../utils';
import { TrendingUp, Calculator, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface CapacityAnalysisTableProps {
  data: Appointment[];
  capacityConfig: CapacityConfigState;
}

const DAYS_MAP: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  0: 'Domingo'
};

export const CapacityAnalysisTable: React.FC<CapacityAnalysisTableProps> = ({ data, capacityConfig }) => {
  const analysis = useMemo(() => {
    const uniqueStudies: Record<string, Appointment> = {};
    data.forEach(item => {
      const group = getResourceGroup(item.cdgo_rcrso);
      if (group !== 'ECOGRAFIA') return;

      const key = `${item.nmro_orden}-${item.item_orden}-${item.cdgo_rcrso}`;
      const regDate = getRegistrationDate(item);
      if (!regDate) return;

      if (!uniqueStudies[key]) {
        uniqueStudies[key] = item;
      } else {
        const currentReg = getRegistrationDate(uniqueStudies[key]);
        if (currentReg && new Date(regDate) > new Date(currentReg)) {
          uniqueStudies[key] = item;
        }
      }
    });

    const dailyCounts: Record<string, number> = {};
    const allDays = new Set<string>();

    Object.values(uniqueStudies).forEach(item => {
      const date = getRegistrationDate(item);
      if (!date) return;
      allDays.add(date);
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    const sortedDays = Array.from(allDays).sort((a, b) => {
      const [ma, da, ya] = a.split('/');
      const [mb, db, yb] = b.split('/');
      return new Date(`${ma}/${da}/${ya}`).getTime() - new Date(`${mb}/${db}/${yb}`).getTime();
    });

    return sortedDays.map(dateStr => {
      const [m, d, y] = dateStr.split('/');
      const dateObj = new Date(`${m}/${d}/${y}`);
      const dayOfWeek = dateObj.getDay();
      const dayName = DAYS_MAP[dayOfWeek];
      const registered = dailyCounts[dateStr] || 0;

      // Base Capacity: Mon-Thu (1-4)
      let baseCapacity = 0;
      if (dayOfWeek >= 1 && dayOfWeek <= 4) {
        // 7:00 AM - 12:00 PM (300 mins) / 8 = 37
        // 2:00 PM - 5:00 PM (180 mins) / 8 = 22
        baseCapacity = calculateStudiesInRange('07:00', '12:00', 8) + calculateStudiesInRange('14:00', '17:00', 8);
      }

      // Additional Capacity from Config
      let additionalCapacity = 0;
      const config = capacityConfig[dayName];
      if (config) {
        config.morningDoctors.forEach(doc => {
          const interval = doc.isDoppler ? 16 : 8;
          additionalCapacity += calculateStudiesInRange(doc.start, doc.end, interval);
        });
        config.afternoonDoctors.forEach(doc => {
          const interval = doc.isDoppler ? 16 : 8;
          additionalCapacity += calculateStudiesInRange(doc.start, doc.end, interval);
        });
      }

      const maxStudies = baseCapacity + additionalCapacity;
      const coverage = maxStudies > 0 ? (registered / maxStudies) * 100 : 0;
      const missing = maxStudies - registered;

      return {
        date: dateStr,
        dayName,
        registered,
        maxStudies,
        coverage,
        missing: missing > 0 ? missing : 0,
        baseCapacity,
        additionalCapacity
      };
    });
  }, [data, capacityConfig]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <Calculator className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-dark">Análisis de Capacidad vs. Demanda (Ecografía)</h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Cumplimiento de metas diarias</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-100">
              <th className="sticky left-0 z-10 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200">Fecha</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center">Registrados</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center">Máximo</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center">Faltante</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center">% Cobertura</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {analysis.map((row, idx) => (
              <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                <td className="sticky left-0 z-10 bg-white px-6 py-4 border-r border-slate-100 group-hover:bg-slate-50">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-brand-dark">{row.date}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{row.dayName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 text-center font-bold">{row.registered}</td>
                <td className="px-6 py-4 text-sm text-brand-primary text-center font-bold">
                  <div className="flex flex-col">
                    <span>{row.maxStudies}</span>
                    <span className="text-[9px] text-slate-400 font-medium uppercase">Base: {row.baseCapacity} + Adic: {row.additionalCapacity}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  <span className={`px-2 py-1 rounded-lg font-bold text-xs ${row.missing > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-brand-primary'}`}>
                    {row.missing > 0 ? `Faltan ${row.missing}` : 'Meta Cumplida'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-sm font-bold ${row.coverage >= 100 ? 'text-brand-primary' : row.coverage >= 80 ? 'text-amber-600' : 'text-brand-accent'}`}>
                      {row.coverage.toFixed(1)}%
                    </span>
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${row.coverage >= 100 ? 'bg-brand-primary' : row.coverage >= 80 ? 'bg-amber-500' : 'bg-brand-accent'}`}
                        style={{ width: `${Math.min(row.coverage, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {row.coverage >= 100 ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-primary mx-auto" />
                  ) : row.coverage >= 80 ? (
                    <Info className="w-5 h-5 text-amber-500 mx-auto" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-brand-accent mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3 h-3" />
          <span>Base: 1 médico (L-J) cada 8 min. Adicional: Configurable por médico.</span>
        </div>
        <div className="flex items-center gap-2">
          <Info className="w-3 h-3 text-brand-primary" />
          <span>Registrados: Basado en la fecha más reciente de ingreso o modificación por estudio.</span>
        </div>
      </div>
    </div>
  );
};

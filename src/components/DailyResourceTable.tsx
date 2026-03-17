import React, { useMemo, useState } from 'react';
import { Appointment } from '../types';
import { getResourceGroup } from '../utils';
import { TrendingUp, Calendar as CalendarIcon, ChevronUp, ChevronDown } from 'lucide-react';

interface DailyResourceTableProps {
  data: Appointment[];
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

export const DailyResourceTable: React.FC<DailyResourceTableProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const stats = useMemo(() => {
    const dailyGroups: Record<string, Record<string, number>> = {};
    const allDays = new Set<string>();
    const resourceGroups = ['ECOGRAFIA', 'RX', 'TAC', 'MAMOGRAFIA', 'OTROS'];

    data.forEach(item => {
      const date = item.fcha?.split(' ')[0] || 'N/A';
      if (date === 'N/A') return;

      allDays.add(date);
      const group = getResourceGroup(item.cdgo_rcrso);

      if (!dailyGroups[group]) dailyGroups[group] = {};
      dailyGroups[group][date] = (dailyGroups[group][date] || 0) + 1;
    });

    const sortedDays = Array.from(allDays).sort((a, b) => {
      const [ma, da, ya] = a.split('/');
      const [mb, db, yb] = b.split('/');
      return new Date(`${ma}/${da}/${ya}`).getTime() - new Date(`${mb}/${db}/${yb}`).getTime();
    });

    const getDayLabel = (dateStr: string) => {
      const [m, d, y] = dateStr.split('/');
      const date = new Date(`${m}/${d}/${y}`);
      const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
      return days[date.getDay()];
    };

    const daysWithLabels = sortedDays.map(day => ({
      date: day,
      label: getDayLabel(day)
    }));

    // Invert: Rows are Days, Columns are Resource Groups
    let tableRows = daysWithLabels.map(day => {
      const row: any = { date: day.date, label: day.label, total: 0 };
      resourceGroups.forEach(group => {
        const count = dailyGroups[group]?.[day.date] || 0;
        row[group] = count;
        row.total += count;
      });
      return row;
    });

    if (sortConfig) {
      tableRows = [...tableRows].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (sortConfig.key === 'date') {
          const [ma, da, ya] = aValue.split('/');
          const [mb, db, yb] = bValue.split('/');
          const timeA = new Date(`${ma}/${da}/${ya}`).getTime();
          const timeB = new Date(`${mb}/${db}/${yb}`).getTime();
          return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return { tableRows, resourceGroups, sortedDays };
  }, [data, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <div className="w-4 h-4 opacity-20"><ChevronUp className="w-4 h-4" /></div>;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-brand-primary" /> : <ChevronDown className="w-4 h-4 text-brand-primary" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-brand-primary" />
          <h3 className="text-lg font-semibold text-brand-dark">Análisis Diario por Grupo de Recurso</h3>
        </div>
      </div>
      <div className="overflow-auto max-h-[600px]">
        <table className="w-full min-w-max text-left border-collapse">
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-50 border-y border-slate-100">
              <th
                className="sticky left-0 top-0 z-30 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors border-r border-slate-200"
                onClick={() => requestSort('date')}
              >
                <div className="flex items-center gap-2">
                  Fecha <SortIcon columnKey="date" />
                </div>
              </th>
              {stats.resourceGroups.map(group => (
                <th
                  key={group}
                  className="sticky top-0 z-20 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => requestSort(group)}
                >
                  <div className="flex items-center justify-center gap-2">
                    {group} <SortIcon columnKey={group} />
                  </div>
                </th>
              ))}
              <th
                className="sticky top-0 z-20 px-6 py-4 text-sm font-semibold text-brand-dark uppercase tracking-wider text-center bg-slate-100 cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={() => requestSort('total')}
              >
                <div className="flex items-center justify-center gap-2">
                  Total Día <SortIcon columnKey="total" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stats.tableRows.map((row, idx) => (
              <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                <td className="sticky left-0 z-10 bg-white px-6 py-4 text-sm text-slate-700 font-medium border-r border-slate-100 group-hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded text-[10px] font-bold text-slate-500">{row.label}</span>
                    <span>{row.date}</span>
                  </div>
                </td>
                {stats.resourceGroups.map(group => (
                  <td key={group} className="px-6 py-4 text-sm text-slate-600 text-center">
                    {row[group] || 0}
                  </td>
                ))}
                <td className="px-6 py-4 text-sm text-brand-dark font-bold text-center bg-slate-50/50">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
        <TrendingUp className="w-3 h-3" />
        <span>Haz clic en los encabezados para ordenar los datos.</span>
      </div>
    </div>
  );
};

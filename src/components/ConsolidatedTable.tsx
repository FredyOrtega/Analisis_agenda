import React, { useMemo, useState } from 'react';
import { Appointment, ConsolidatedRow } from '../types';
import { getResourceGroup, calculateOpportunityDays, getAppointmentStatus } from '../utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ConsolidatedTableProps {
  data: Appointment[];
  groupBy: 'rzon_scial' | 'cdgo_rcrso' | 'resource_group' | 'resource_group_by_entity';
  title: string;
  onRowClick?: (title: string, items: Appointment[]) => void;
}

type SortConfig = {
  key: keyof ConsolidatedRow | 'efficiency' | 'avgOpp';
  direction: 'asc' | 'desc';
} | null;

export const ConsolidatedTable: React.FC<ConsolidatedTableProps> = ({ data, groupBy, title, onRowClick }) => {
  const now = useMemo(() => new Date('2026-03-05T08:27:33-08:00'), []);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const consolidatedData = useMemo(() => {
    const groups: Record<string, { row: ConsolidatedRow; items: Appointment[] }> = {};

    data.forEach(item => {
      let key = 'N/A';
      let subKey = '';

      if (groupBy === 'resource_group') {
        key = getResourceGroup(item.cdgo_rcrso);
      } else if (groupBy === 'resource_group_by_entity') {
        key = getResourceGroup(item.cdgo_rcrso);
        subKey = item.rzon_scial || 'N/A';
      } else {
        key = item[groupBy as keyof Appointment] as string || 'N/A';
      }

      const compositeKey = subKey ? `${key} - ${subKey}` : key;

      if (!groups[compositeKey]) {
        groups[compositeKey] = {
          row: {
            category: key,
            subCategory: subKey,
            total: 0,
            attended: 0,
            noShow: 0,
            reiteratedNoShow: 0,
            pending: 0,
            reassigned: 0,
            totalOpportunityDays: 0,
            countForOpportunity: 0
          },
          items: []
        };
      }

      const group = groups[compositeKey];
      group.items.push(item);
      const row = group.row;
      row.total++;
      
      const status = getAppointmentStatus(item, now, data);
      if (status === 'ATTENDED') row.attended++;
      else if (status === 'REAL_INASISTENCIA') row.noShow++;
      else if (status === 'REITERATED_NO_SHOW') row.reiteratedNoShow++;
      else if (status === 'PENDING') row.pending++;
      else if (status === 'REASSIGNED') row.reassigned++;

      const opp = calculateOpportunityDays(item);
      if (opp !== null) {
        row.totalOpportunityDays += opp;
        row.countForOpportunity++;
      }
    });

    let items = Object.values(groups);

    if (sortConfig) {
      items.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'efficiency') {
          aValue = a.row.total > 0 ? (a.row.attended / a.row.total) : 0;
          bValue = b.row.total > 0 ? (b.row.attended / b.row.total) : 0;
        } else if (sortConfig.key === 'avgOpp') {
          aValue = a.row.countForOpportunity > 0 ? (a.row.totalOpportunityDays / a.row.countForOpportunity) : -1;
          bValue = b.row.countForOpportunity > 0 ? (b.row.totalOpportunityDays / b.row.countForOpportunity) : -1;
        } else {
          aValue = a.row[sortConfig.key as keyof ConsolidatedRow];
          bValue = b.row[sortConfig.key as keyof ConsolidatedRow];
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort
      items.sort((a, b) => {
        if (a.row.category !== b.row.category) return a.row.category.localeCompare(b.row.category);
        return b.row.total - a.row.total;
      });
    }

    return items;
  }, [data, groupBy, now, sortConfig]);

  const requestSort = (key: SortConfig['key']) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: SortConfig['key'] }) => {
    if (sortConfig?.key !== columnKey) return <div className="w-3 h-3 opacity-20"><ChevronUp className="w-3 h-3" /></div>;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-brand-primary" /> : <ChevronDown className="w-3 h-3 text-brand-primary" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-bottom border-slate-100">
        <h3 className="text-lg font-semibold text-brand-dark">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-100">
              <th 
                className="sticky left-0 z-10 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors border-r border-slate-200"
                onClick={() => requestSort('category')}
              >
                <div className="flex items-center gap-2">
                  {groupBy === 'resource_group_by_entity' ? 'Grupo / Razón Social' : 'Categoría'}
                  <SortIcon columnKey="category" />
                </div>
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('total')}>
                <div className="flex items-center justify-center gap-1">Total <SortIcon columnKey="total" /></div>
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('attended')}>
                <div className="flex items-center justify-center gap-1">Atendidas <SortIcon columnKey="attended" /></div>
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('noShow')}>
                <div className="flex items-center justify-center gap-1">Inasistencias <SortIcon columnKey="noShow" /></div>
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('reiteratedNoShow')}>
                <div className="flex items-center justify-center gap-1">Reiteradas <SortIcon columnKey="reiteratedNoShow" /></div>
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('pending')}>
                <div className="flex items-center justify-center gap-1">Por Asistir <SortIcon columnKey="pending" /></div>
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('reassigned')}>
                <div className="flex items-center justify-center gap-1">Reasignadas <SortIcon columnKey="reassigned" /></div>
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('avgOpp')}>
                <div className="flex items-center justify-center gap-1">Oportunidad <SortIcon columnKey="avgOpp" /></div>
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('efficiency')}>
                <div className="flex items-center justify-center gap-1">% Efic. <SortIcon columnKey="efficiency" /></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {consolidatedData.map(({ row, items }, idx) => {
              const efficiency = row.total > 0 ? ((row.attended / row.total) * 100).toFixed(1) : '0.0';
              const avgOpp = row.countForOpportunity > 0 ? (row.totalOpportunityDays / row.countForOpportunity).toFixed(1) : 'N/A';
              const isClickable = !!onRowClick;
              
              return (
                <tr 
                  key={idx} 
                  className={`group transition-colors ${isClickable ? 'hover:bg-brand-primary/5 cursor-pointer' : 'hover:bg-slate-50'}`}
                  onClick={() => isClickable && onRowClick(`${row.category}${row.subCategory ? ` - ${row.subCategory}` : ''}`, items)}
                >
                  <td className="sticky left-0 z-10 bg-white px-6 py-4 text-sm text-slate-700 font-medium border-r border-slate-100 group-hover:bg-brand-primary/5">
                    {row.subCategory ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-bold uppercase">{row.category}</span>
                        <span>{row.subCategory}</span>
                      </div>
                    ) : row.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 text-center">{row.total}</td>
                  <td className="px-6 py-4 text-sm text-brand-primary font-medium text-center">{row.attended}</td>
                  <td 
                    className={`px-6 py-4 text-sm text-brand-accent font-medium text-center ${onRowClick ? 'cursor-pointer hover:bg-brand-accent/5' : ''}`}
                    onClick={(e) => {
                      if (onRowClick) {
                        e.stopPropagation();
                        onRowClick(`Inasistencias: ${row.category}${row.subCategory ? ` - ${row.subCategory}` : ''}`, items.filter(i => getAppointmentStatus(i, now, data) === 'REAL_INASISTENCIA'));
                      }
                    }}
                  >
                    {row.noShow}
                  </td>
                  <td 
                    className={`px-6 py-4 text-sm text-brand-accent font-medium text-center ${onRowClick ? 'cursor-pointer hover:bg-brand-accent/5' : ''}`}
                    onClick={(e) => {
                      if (onRowClick) {
                        e.stopPropagation();
                        onRowClick(`Inasistencias Reiteradas: ${row.category}${row.subCategory ? ` - ${row.subCategory}` : ''}`, items.filter(i => getAppointmentStatus(i, now, data) === 'REITERATED_NO_SHOW'));
                      }
                    }}
                  >
                    {row.reiteratedNoShow}
                  </td>
                  <td className="px-6 py-4 text-sm text-amber-600 font-medium text-center">{row.pending}</td>
                  <td className="px-6 py-4 text-sm text-blue-600 font-medium text-center">{row.reassigned}</td>
                  <td className="px-6 py-4 text-sm text-brand-primary font-medium text-center">{avgOpp}</td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      Number(efficiency) > 80 ? 'bg-emerald-100 text-brand-primary' : 
                      Number(efficiency) > 50 ? 'bg-amber-100 text-amber-700' : 
                      'bg-red-100 text-brand-accent'
                    }`}>
                      {efficiency}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

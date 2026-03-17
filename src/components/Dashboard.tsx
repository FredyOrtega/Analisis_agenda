import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList, ComposedChart, Line
} from 'recharts';
import { Appointment, DashboardStats } from '../types';
import { Users, CheckCircle, XCircle, RefreshCw, Calendar, X, Info } from 'lucide-react';
import { getResourceGroup, getAppointmentStatus, getRegistrationDate, getModificationDate } from '../utils';
import { ConsolidatedTable } from './ConsolidatedTable';

interface DashboardProps {
  data: Appointment[];
  onStatClick?: (title: string, items: Appointment[]) => void;
}

const COLORS = ['#02a58d', '#ff4d63', '#3b82f6', '#f59e0b', '#8b5cf6', '#252525'];

export const Dashboard: React.FC<DashboardProps> = ({ data, onStatClick }) => {
  const now = useMemo(() => new Date('2026-03-05T08:27:33-08:00'), []);
  const [selectedDayUsers, setSelectedDayUsers] = useState<{ day: string; users: Record<string, number> } | null>(null);
  const [selectedEntityHistory, setSelectedEntityHistory] = useState<{ entity: string; history: any[] } | null>(null);

  const stats = useMemo<DashboardStats>(() => {
    const total = data.length;
    let attended = 0;
    let noShow = 0;
    let reiteratedNoShow = 0;
    let reassigned = 0;
    let cancelled = 0;
    let pending = 0;

    const days = new Set<string>();

    data.forEach(item => {
      if (item.fcha) {
        days.add(item.fcha.split(' ')[0]);
      }

      const status = getAppointmentStatus(item, now, data);
      if (status === 'ATTENDED') attended++;
      else if (status === 'REAL_INASISTENCIA') noShow++;
      else if (status === 'REITERATED_NO_SHOW') reiteratedNoShow++;
      else if (status === 'PENDING') pending++;
      else if (status === 'REASSIGNED') reassigned++;
      else if (status === 'CANCELLED') cancelled++;
    });

    const avgPerDay = days.size > 0 ? total / days.size : 0;

    return { total, attended, noShow, reiteratedNoShow, reassigned, cancelled, pending, avgPerDay };
  }, [data, now]);

  const registrationChartData = useMemo(() => {
    const dailyGroupCounts: Record<string, Record<string, number>> = {};
    const groups = new Set<string>();

    data.forEach(item => {
      const date = getModificationDate(item);
      if (!date) return;
      
      const group = getResourceGroup(item.cdgo_rcrso);
      groups.add(group);

      if (!dailyGroupCounts[date]) {
        dailyGroupCounts[date] = {};
      }
      dailyGroupCounts[date][group] = (dailyGroupCounts[date][group] || 0) + 1;
    });

    const sortedDates = Object.keys(dailyGroupCounts).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return {
      data: sortedDates.map(date => {
        const counts = dailyGroupCounts[date];
        const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
        return {
          date,
          ...counts,
          total
        };
      }),
      groups: Array.from(groups)
    };
  }, [data]);

  const registrationTableData = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    const entityDays: Record<string, Set<string>> = {};
    const entities = new Set<string>();
    const resourceGroups = ['ECOGRAFIA', 'RX', 'TAC', 'MAMOGRAFIA', 'OTROS'];

    data.forEach(item => {
      const date = getModificationDate(item);
      if (!date) return;

      const group = getResourceGroup(item.cdgo_rcrso);
      const entity = item.rzon_scial || 'N/A';
      entities.add(entity);

      if (!counts[entity]) counts[entity] = {};
      counts[entity][group] = (counts[entity][group] || 0) + 1;

      if (!entityDays[entity]) entityDays[entity] = new Set();
      entityDays[entity].add(date);
    });

    return {
      rows: Array.from(entities).sort().map(entity => {
        const total = Object.values(counts[entity]).reduce((sum, val) => sum + val, 0);
        const daysCount = entityDays[entity].size || 1;
        return {
          entity,
          ...counts[entity],
          total,
          avgPerDay: total / daysCount
        };
      }),
      resourceGroups
    };
  }, [data]);

  const handleChartClick = (state: any) => {
    if (state && state.activeLabel) {
      const day = state.activeLabel;
      const userCounts: Record<string, number> = {};
      
      data.forEach(item => {
        if (getModificationDate(item) === day) {
          const user = item.usrio_mdfccion || 'N/A';
          userCounts[user] = (userCounts[user] || 0) + 1;
        }
      });
      
      setSelectedDayUsers({ day, users: userCounts });
    }
  };

  const handleEntityRowClick = (entity: string) => {
    const dailyBreakdown: Record<string, Record<string, number>> = {};
    const groups = ['ECOGRAFIA', 'RX', 'TAC', 'MAMOGRAFIA', 'OTROS'];
    
    data.forEach(item => {
      if ((item.rzon_scial || 'N/A') === entity) {
        const date = getModificationDate(item);
        if (!date) return;
        
        const group = getResourceGroup(item.cdgo_rcrso);
        if (!dailyBreakdown[date]) {
          dailyBreakdown[date] = {};
          groups.forEach(g => dailyBreakdown[date][g] = 0);
        }
        dailyBreakdown[date][group]++;
      }
    });

    const history = Object.entries(dailyBreakdown)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, counts]) => ({
        date,
        ...counts,
        total: Object.values(counts).reduce((sum, val) => (sum as number) + (val as number), 0)
      }));

    setSelectedEntityHistory({ entity, history });
  };

  const groupData = useMemo(() => {
    const groups: Record<string, number> = {
      'ECOGRAFIA': 0,
      'RX': 0,
      'TAC': 0,
      'MAMOGRAFIA': 0,
      'OTROS': 0
    };

    data.forEach(item => {
      const group = getResourceGroup(item.cdgo_rcrso);
      groups[group]++;
    });

    return Object.entries(groups)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [data]);

  const statusChartData = [
    { name: 'Atendidas', value: stats.attended },
    { name: 'Inasistencias Reales', value: stats.noShow },
    { name: 'Inasistencias Reiteradas', value: stats.reiteratedNoShow },
    { name: 'Por Asistir', value: stats.pending },
    { name: 'Reasignadas', value: stats.reassigned },
    { name: 'Canceladas', value: stats.cancelled },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <StatCard 
          id="stat-total"
          title="Total" 
          value={stats.total} 
          icon={<Calendar className="w-6 h-6 text-brand-dark" />} 
          color="bg-slate-50"
        />
        <StatCard 
          id="stat-avg"
          title="Promedio/Día" 
          value={stats.avgPerDay.toFixed(1)} 
          icon={<Users className="w-6 h-6 text-brand-primary" />} 
          color="bg-emerald-50/50"
        />
        <StatCard 
          id="stat-attended"
          title="Atendidas" 
          value={stats.attended} 
          icon={<CheckCircle className="w-6 h-6 text-brand-primary" />} 
          color="bg-emerald-50"
        />
        <StatCard 
          id="stat-noshow"
          title="Inasistencias Reales" 
          value={stats.noShow} 
          icon={<XCircle className="w-6 h-6 text-brand-accent" />} 
          color="bg-rose-50"
          onClick={() => onStatClick?.('Inasistencias Reales', data.filter(item => getAppointmentStatus(item, now, data) === 'REAL_INASISTENCIA'))}
        />
        <StatCard 
          id="stat-reiterated-noshow"
          title="Inasistencias Reiteradas" 
          value={stats.reiteratedNoShow} 
          icon={<XCircle className="w-6 h-6 text-brand-accent" />} 
          color="bg-rose-100/50"
          onClick={() => onStatClick?.('Inasistencias Reiteradas', data.filter(item => getAppointmentStatus(item, now, data) === 'REITERATED_NO_SHOW'))}
        />
        <StatCard 
          id="stat-pending"
          title="Por Asistir" 
          value={stats.pending} 
          icon={<Calendar className="w-6 h-6 text-amber-500" />} 
          color="bg-amber-50"
        />
        <StatCard 
          id="stat-reassigned"
          title="Reasignadas" 
          value={stats.reassigned} 
          icon={<RefreshCw className="w-6 h-6 text-blue-500" />} 
          color="bg-blue-50"
        />
        <StatCard 
          id="stat-cancelled"
          title="Canceladas" 
          value={stats.cancelled} 
          icon={<XCircle className="w-6 h-6 text-slate-400" />} 
          color="bg-slate-50"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6">
        <div id="chart-registrations" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-brand-dark">Cantidad de Estudios Registrados por Día (Fecha Modificación)</h3>
          <p className="text-xs text-slate-500 mb-4 uppercase tracking-wider">Totalizado por fecha de modificación y grupo de estudio</p>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={registrationChartData.data} onClick={handleChartClick}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Legend />
                {registrationChartData.groups.map((group, idx) => (
                  <Bar 
                    key={group} 
                    dataKey={group} 
                    stackId="a" 
                    fill={COLORS[idx % COLORS.length]} 
                    name={group}
                    cursor="pointer"
                  />
                ))}
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="transparent" 
                  dot={false} 
                  activeDot={false}
                  legendType="none"
                >
                  <LabelList dataKey="total" position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#475569' }} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Breakdown Section (Conditional) */}
        {selectedDayUsers && (
          <div className="bg-emerald-50/50 p-6 rounded-2xl border border-brand-primary/20 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-primary" />
                <h4 className="font-bold text-brand-dark">Registros por Usuario - {selectedDayUsers.day}</h4>
              </div>
              <button onClick={() => setSelectedDayUsers(null)} className="p-1 hover:bg-emerald-100 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(selectedDayUsers.users).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([user, count]) => (
                <div key={user} className="bg-white p-3 rounded-xl border border-brand-primary/10 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase truncate" title={user}>{user}</p>
                  <p className="text-lg font-bold text-brand-primary">{count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Registration Table Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-brand-dark">Resumen de Estudios Registrados por Entidad</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-100">
                  <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200">Entidad (Razón Social)</th>
                  {registrationTableData.resourceGroups.map(group => (
                    <th key={group} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">{group}</th>
                  ))}
                  <th className="px-4 py-3 text-xs font-bold text-brand-dark uppercase tracking-wider text-center bg-slate-100/50">Prom/Día</th>
                  <th className="px-4 py-3 text-xs font-bold text-brand-dark uppercase tracking-wider text-center bg-slate-100/50">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrationTableData.rows.map((row, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleEntityRowClick(row.entity)}>
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm text-brand-dark font-medium border-r border-slate-100 group-hover:bg-slate-50">{row.entity}</td>
                    {registrationTableData.resourceGroups.map(group => (
                      <td key={group} className="px-4 py-3 text-sm text-slate-600 text-center">
                        {(row as any)[group] || 0}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm text-brand-primary font-bold text-center bg-emerald-50/30">
                      {row.avgPerDay.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-dark font-bold text-center bg-slate-50/50">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Entity History Modal */}
      {selectedEntityHistory && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <Info className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-brand-dark">Historial Diario por Entidad</h3>
                  <p className="text-sm text-slate-500 font-medium">{selectedEntityHistory.entity}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEntityHistory(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-max text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200">Fecha</th>
                      {['ECOGRAFIA', 'RX', 'TAC', 'MAMOGRAFIA', 'OTROS'].map(g => (
                        <th key={g} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">{g}</th>
                      ))}
                      <th className="px-4 py-3 text-xs font-bold text-brand-dark uppercase tracking-wider text-center bg-slate-100/50">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedEntityHistory.history.map((day, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                        <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm text-brand-dark font-bold border-r border-slate-100 group-hover:bg-slate-50">{day.date}</td>
                        {['ECOGRAFIA', 'RX', 'TAC', 'MAMOGRAFIA', 'OTROS'].map(g => (
                          <td key={g} className="px-4 py-3 text-sm text-slate-600 text-center">{day[g]}</td>
                        ))}
                        <td className="px-4 py-3 text-sm text-brand-dark font-bold text-center bg-slate-50/50">{day.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button onClick={() => setSelectedEntityHistory(null)} className="px-6 py-2 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <ConsolidatedTable 
          data={data} 
          groupBy="resource_group_by_entity" 
          title="Consolidado por Grupo de Estudio y Razón Social" 
          onRowClick={onStatClick}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div id="chart-groups" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-brand-dark">Distribución por Grupo de Recurso</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#02a58d" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div id="chart-status" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-brand-dark">Estado de Citas</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  id: string;
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ id, title, value, icon, color, onClick }) => (
  <div 
    id={id} 
    onClick={onClick}
    className={`${color} p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 min-w-0 ${onClick ? 'cursor-pointer hover:shadow-md transition-all active:scale-95' : ''}`}
  >
    <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate" title={title}>{title}</p>
      <p className="text-xl font-bold text-brand-dark truncate">{value}</p>
    </div>
  </div>
);

import React, { useState, useMemo } from 'react';
import { Dashboard } from './components/Dashboard';
import { ConsolidatedTable } from './components/ConsolidatedTable';
import { FileUploader } from './components/FileUploader';
import { DailyResourceTable } from './components/DailyResourceTable';
import { DetailModal } from './components/DetailModal';
import { CapacityManager } from './components/CapacityManager';
import { CapacityAnalysisTable } from './components/CapacityAnalysisTable';
import { Appointment, CapacityConfigState } from './types';
import { Search, LayoutDashboard, Table as TableIcon, Upload, Download, BarChart2, Calculator, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { downloadCSV, getAppointmentStatus, getResourceGroup, calculateStudiesInRange, getRegistrationDate } from './utils';

export default function App() {
  const [data, setData] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'dashboard' | 'tables' | 'upload' | 'daily' | 'capacity'>('dashboard');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [capacityConfig, setCapacityConfig] = useState<CapacityConfigState>(
    ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].reduce((acc, day) => ({
      ...acc,
      [day]: {
        morningDoctors: [],
        afternoonDoctors: []
      }
    }), {})
  );

  // Modal state
  const [modalData, setModalData] = useState<{ isOpen: boolean; title: string; items: Appointment[] }>({
    isOpen: false,
    title: '',
    items: []
  });

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch =
        item.nmbre_pcnte?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.rzon_scial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cdgo_rcrso?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id_pcnte?.includes(searchTerm);

      const dateStr = item.fcha?.split(' ')[0] || '';
      if (!dateStr) return matchesSearch;

      const [m, d, y] = dateStr.split('/');
      const itemDate = new Date(`${m}/${d}/${y}`);

      let matchesDate = true;
      if (startDate) {
        const start = new Date(startDate);
        matchesDate = matchesDate && itemDate >= start;
      }
      if (endDate) {
        const end = new Date(endDate);
        matchesDate = matchesDate && itemDate <= end;
      }

      return matchesSearch && matchesDate;
    });
  }, [data, searchTerm, startDate, endDate]);

  const handleDataLoaded = (newData: Appointment[]) => {
    // Reset all filters and states before loading new data
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setModalData({ isOpen: false, title: '', items: [] });
    setCapacityConfig(
      ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].reduce((acc, day) => ({
        ...acc,
        [day]: {
          morningDoctors: [],
          afternoonDoctors: []
        }
      }), {})
    );

    // Set new data and change view
    setData(newData);
    setView('dashboard');
  };

  const handleDownloadInasistencias = () => {
    const now = new Date('2026-03-05T09:14:08-08:00');
    const inasistencias = filteredData.filter(item => getAppointmentStatus(item, now, data) === 'REAL_INASISTENCIA');
    downloadCSV(inasistencias, 'inasistencias_reales_detallado');
  };

  const handleDownloadInasistenciasReiteradas = () => {
    const now = new Date('2026-03-05T09:14:08-08:00');
    const reiteradas = filteredData.filter(item => getAppointmentStatus(item, now, data) === 'REITERATED_NO_SHOW');
    downloadCSV(reiteradas, 'inasistencias_reiteradas_detallado');
  };

  const handleDownloadReasignadas = () => {
    const reasignadas = data.filter(item => item.estdo_rsrva === 'R');
    downloadCSV(reasignadas, 'reasignadas_detallado');
  };

  const capacityStats = useMemo(() => {
    const uniqueStudies: Record<string, Appointment> = {};
    filteredData.forEach(item => {
      if (getResourceGroup(item.cdgo_rcrso) === 'ECOGRAFIA') {
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
      }
    });

    const dailyCounts: Record<string, number> = {};
    Object.values(uniqueStudies).forEach(item => {
      const date = getRegistrationDate(item);
      if (date) dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    const days = Object.keys(dailyCounts);
    if (days.length === 0) return { avgCoverage: 0, deficitDays: 0, totalRegistered: 0 };

    let totalCoverage = 0;
    let deficitDays = 0;
    let totalRegistered = 0;

    days.forEach(dateStr => {
      const [m, d, y] = dateStr.split('/');
      const dateObj = new Date(`${m}/${d}/${y}`);
      const dayOfWeek = dateObj.getDay();
      const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dayOfWeek];
      const registered = dailyCounts[dateStr];
      totalRegistered += registered;

      let base = 0;
      if (dayOfWeek >= 1 && dayOfWeek <= 4) {
        base = 59; // 37 + 22 as calculated before
      }

      let additional = 0;
      const config = capacityConfig[dayName];
      if (config) {
        config.morningDoctors.forEach(doc => {
          const interval = doc.isDoppler ? 16 : 8;
          additional += calculateStudiesInRange(doc.start, doc.end, interval);
        });
        config.afternoonDoctors.forEach(doc => {
          const interval = doc.isDoppler ? 16 : 8;
          additional += calculateStudiesInRange(doc.start, doc.end, interval);
        });
      }

      const max = base + additional;
      if (max > 0) {
        totalCoverage += (registered / max) * 100;
        if (registered < max) deficitDays++;
      }
    });

    return {
      avgCoverage: totalCoverage / days.length,
      deficitDays,
      totalRegistered
    };
  }, [filteredData, capacityConfig]);

  const openDetailModal = (title: string, items: Appointment[]) => {
    setModalData({
      isOpen: true,
      title,
      items
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-brand-primary p-2 rounded-lg">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-dark tracking-tight leading-none">Seguimiento de Agendamiento</h1>
              <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">Gestión de Indicadores</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 px-2 border-r border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Desde</span>
                <input
                  type="date"
                  className="text-xs bg-transparent border-none focus:ring-0 p-0"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 px-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Hasta</span>
                <input
                  type="date"
                  className="text-xs bg-transparent border-none focus:ring-0 p-0"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar paciente, recurso..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-primary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setView('daily')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'daily' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <BarChart2 className="w-4 h-4" />
                Diario
              </button>
              <button
                onClick={() => setView('capacity')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'capacity' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <Calculator className="w-4 h-4" />
                Capacidad
              </button>
              <button
                onClick={() => setView('tables')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'tables' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <TableIcon className="w-4 h-4" />
                Tablas
              </button>
              <button
                onClick={() => setView('upload')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'upload' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <Upload className="w-4 h-4" />
                Cargar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'upload' ? (
              <div className="max-w-2xl mx-auto py-12">
                <FileUploader onDataLoaded={handleDataLoaded} />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Actions Row */}
                <div className="flex flex-wrap gap-4 justify-end">
                  <button
                    onClick={handleDownloadInasistencias}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4 text-brand-accent" />
                    Descargar Inasistencias
                  </button>
                  <button
                    onClick={handleDownloadInasistenciasReiteradas}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4 text-brand-accent" />
                    Descargar Inasistencias Reiteradas
                  </button>
                  <button
                    onClick={handleDownloadReasignadas}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4 text-blue-500" />
                    Descargar Reasignadas
                  </button>
                </div>

                {view === 'dashboard' ? (
                  <div className="space-y-8">
                    <Dashboard data={filteredData} onStatClick={openDetailModal} />

                    <div className="grid grid-cols-1 gap-8">
                      <ConsolidatedTable
                        data={filteredData}
                        groupBy="rzon_scial"
                        title="Consolidado por Razón Social"
                        onRowClick={openDetailModal}
                      />
                    </div>
                  </div>
                ) : view === 'daily' ? (
                  <div className="space-y-8">
                    <DailyResourceTable data={filteredData} />
                  </div>
                ) : view === 'capacity' ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-0">
                        <div className="p-3 bg-emerald-50 rounded-xl shrink-0">
                          <Calculator className="w-6 h-6 text-brand-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-500 truncate" title="Total Estudios Reg.">Total Estudios Reg.</p>
                          <p className="text-2xl font-bold text-brand-dark truncate">
                            {capacityStats.totalRegistered}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-0">
                        <div className="p-3 bg-emerald-50 rounded-xl shrink-0">
                          <CheckCircle2 className="w-6 h-6 text-brand-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-500 truncate" title="Promedio Cobertura">Promedio Cobertura</p>
                          <p className="text-2xl font-bold text-brand-dark truncate">
                            {capacityStats.avgCoverage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-0">
                        <div className="p-3 bg-amber-50 rounded-xl shrink-0">
                          <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-500 truncate" title="Días con Déficit">Días con Déficit</p>
                          <p className="text-2xl font-bold text-brand-dark truncate">
                            {capacityStats.deficitDays}
                          </p>
                        </div>
                      </div>
                    </div>
                    <CapacityManager config={capacityConfig} onConfigChange={setCapacityConfig} />
                    <CapacityAnalysisTable data={filteredData} capacityConfig={capacityConfig} />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <ConsolidatedTable
                      data={filteredData}
                      groupBy="rzon_scial"
                      title="Consolidado por Razón Social"
                      onRowClick={openDetailModal}
                    />

                    {/* Detailed Tables by Resource Group */}
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-brand-dark border-l-4 border-brand-primary pl-4 py-1">Detalle por Grupo de Recurso y Entidad</h2>
                      <div className="grid grid-cols-1 gap-8">
                        {['ECOGRAFIA', 'RX', 'TAC', 'MAMOGRAFIA', 'OTROS'].map(group => {
                          const groupData = filteredData.filter(item => getResourceGroup(item.cdgo_rcrso) === group);

                          if (groupData.length === 0) return null;

                          return (
                            <ConsolidatedTable
                              key={group}
                              data={groupData}
                              groupBy="rzon_scial"
                              title={`Detalle Entidades: ${group}`}
                              onRowClick={openDetailModal}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <ConsolidatedTable
                      data={filteredData}
                      groupBy="resource_group"
                      title="Consolidado por Grupo de Recurso"
                      onRowClick={openDetailModal}
                    />
                    <ConsolidatedTable
                      data={filteredData}
                      groupBy="cdgo_rcrso"
                      title="Consolidado por Recurso Individual"
                      onRowClick={openDetailModal}
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Detail Modal */}
      <DetailModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ ...modalData, isOpen: false })}
        title={modalData.title}
        data={modalData.items}
        allData={filteredData}
      />

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-200">
        <p className="text-center text-sm text-slate-500">
          © 2026 Sistema de Gestión de Agendamiento Médico.
        </p>
      </footer>
    </div>
  );
}

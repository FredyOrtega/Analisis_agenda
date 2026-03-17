import React, { useState } from 'react';
import { Appointment } from '../types';
import { X, AlertCircle, Clock, User } from 'lucide-react';
import { calculateOpportunityDays } from '../utils';
import { PatientHistoryModal } from './PatientHistoryModal';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Appointment[];
  allData: Appointment[];
}

export const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, title, data, allData }) => {
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);

  if (!isOpen) return null;

  const patientHistory = allData.filter(item => item.id_pcnte === selectedPatient?.id);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Clock className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-brand-dark">{title}</h3>
                <p className="text-sm text-slate-500 font-medium">Listado detallado de registros ({data.length})</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-4 bg-emerald-50 rounded-full">
                  <AlertCircle className="w-12 h-12 text-brand-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-brand-dark">No se encontraron registros</h4>
                  <p className="text-slate-500 max-w-xs mx-auto">No hay datos para mostrar en este grupo.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-max text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200">Paciente</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Recurso</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Ingreso</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Cita</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Oportunidad</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((item, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                        <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm text-slate-800 font-medium border-r border-slate-100 group-hover:bg-slate-50">{item.nmbre_pcnte}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{item.id_pcnte}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.cdgo_rcrso}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 text-center">{item.fcha_ingrso?.split(' ')[0]}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 text-center">{item.fcha?.split(' ')[0]}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`px-2 py-1 rounded-lg font-bold text-xs ${
                            (calculateOpportunityDays(item) || 0) > 3 ? 'bg-red-100 text-brand-accent' : 'bg-emerald-100 text-brand-primary'
                          }`}>
                            {calculateOpportunityDays(item)} días
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{item.tlfno_movil || item.tlfno}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <button 
                            onClick={() => setSelectedPatient({ id: item.id_pcnte, name: item.nmbre_pcnte })}
                            className="p-1.5 bg-brand-primary/10 text-brand-primary rounded-lg hover:bg-brand-primary/20 transition-all active:scale-95"
                            title="Ver Historial"
                          >
                            <User className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-brand-dark text-white rounded-xl font-bold hover:bg-brand-dark/90 transition-all active:scale-95"
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      </div>

      <PatientHistoryModal 
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        patientId={selectedPatient?.id || ''}
        patientName={selectedPatient?.name || ''}
        history={patientHistory}
      />
    </>
  );
};

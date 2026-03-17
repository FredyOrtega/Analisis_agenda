import React from 'react';
import { Appointment } from '../types';
import { X, User, Calendar, Tag, FileText } from 'lucide-react';
import { getAppointmentStatus } from '../utils';

interface PatientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  history: Appointment[];
}

export const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  patientId, 
  patientName, 
  history 
}) => {
  if (!isOpen) return null;

  const now = new Date('2026-03-05T09:14:08-08:00');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <User className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand-dark">Historial del Paciente</h3>
              <p className="text-sm text-slate-500 font-medium">{patientName} (ID: {patientId})</p>
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
          <div className="space-y-4">
            {history.sort((a, b) => {
              const dateA = new Date(a.fcha?.split(' ')[0] || '');
              const dateB = new Date(b.fcha?.split(' ')[0] || '');
              return dateB.getTime() - dateA.getTime();
            }).map((item, idx) => {
              const status = getAppointmentStatus(item, now, history);
              
              return (
                <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      status === 'ATTENDED' ? 'bg-emerald-100 text-brand-primary' :
                      status === 'REAL_INASISTENCIA' ? 'bg-red-100 text-brand-accent' :
                      status === 'REITERATED_NO_SHOW' ? 'bg-rose-100 text-brand-accent' :
                      status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{item.fcha?.split(' ')[0]}</span>
                        <span className="text-xs text-slate-400">{item.hra_incial}</span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium">{item.cdgo_rcrso}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-sm">
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Orden: {item.nmro_orden}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-sm">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Estado: {item.estdo_rsrva}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      status === 'ATTENDED' ? 'bg-emerald-100 text-brand-primary' :
                      status === 'REAL_INASISTENCIA' ? 'bg-red-100 text-brand-accent' :
                      status === 'REITERATED_NO_SHOW' ? 'bg-rose-100 text-brand-accent' :
                      status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {status === 'ATTENDED' ? 'Atendida' :
                       status === 'REAL_INASISTENCIA' ? 'Inasistencia' :
                       status === 'REITERATED_NO_SHOW' ? 'Inasistencia Reiterada' :
                       status === 'PENDING' ? 'Por Asistir' :
                       status === 'REASSIGNED' ? 'Reasignada' :
                       status === 'CANCELLED' ? 'Cancelada' : 'Desconocido'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all active:scale-95"
          >
            Cerrar Historial
          </button>
        </div>
      </div>
    </div>
  );
};

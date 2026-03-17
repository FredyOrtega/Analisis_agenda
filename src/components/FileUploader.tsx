import React, { useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Appointment } from '../types';

interface FileUploaderProps {
  onDataLoaded: (data: Appointment[]) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onDataLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/);
      
      if (lines.length < 2) return;

      // Skip header and parse lines
      const parsedData: Appointment[] = lines.slice(1).filter(line => line.trim() !== '').map(line => {
        const columns = line.split('\t');
        return {
          cdgo_emprsa: columns[0] || '',
          nmro_orden: columns[1] || '',
          item_orden: columns[2] || '',
          nmro_cta: columns[3] || '',
          cdgo_srvcio_intrno: columns[4] || '',
          id_pcnte: columns[5] || '',
          orgen_cnslta: columns[6] || '',
          nmbre_pcnte: columns[7] || '',
          cdgo_rcrso: columns[8] || '',
          fcha: columns[9] || '',
          hra_incial: columns[10] || '',
          hra_fnal: columns[11] || '',
          hra_atncion: columns[12] || '',
          cdgo_clnte: columns[13] || '',
          edad: parseInt(columns[14]) || 0,
          undad_edad: columns[15] || '',
          tlfno: columns[16] || '',
          usrio_ingrso: columns[17] || '',
          fcha_ingrso: columns[18] || '',
          usrio_mdfccion: columns[19] || '',
          fcha_mdfccion: columns[20] || '',
          estdo_rsrva: columns[21] || '',
          cta_smnstrda: columns[22] || '',
          rzon_scial: columns[23] || '',
          cmntrios: columns[24] || '',
          tlfno_movil: columns[25] || '',
          prcio_trfa: parseFloat(columns[26]) || 0
        };
      });

      onDataLoaded(parsedData);
    };
    reader.readAsText(file);
  };

  return (
    <div id="file-uploader" className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-primary transition-colors group">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".txt,.tsv,.csv"
        className="hidden"
      />
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 bg-emerald-50 rounded-full group-hover:bg-emerald-100 transition-colors">
          <Upload className="w-8 h-8 text-brand-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-brand-dark">Cargar Archivo de Agendamiento</h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">
            Sube tu archivo plano separado por tabulaciones (.txt o .tsv)
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2.5 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary/90 shadow-sm transition-all active:scale-95"
        >
          Seleccionar Archivo
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-4">
          <AlertCircle className="w-3 h-3" />
          <span>Estructura requerida: 27 columnas (cdgo_emprsa...prcio_trfa)</span>
        </div>
      </div>
    </div>
  );
};

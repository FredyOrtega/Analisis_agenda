import { Appointment } from './types';

export const getResourceGroup = (code: string): string => {
  const c = code?.toUpperCase() || '';
  if (['ECO02', 'ECO1', 'ECO2'].includes(c)) return 'ECOGRAFIA';
  if (['RX1', 'RX2'].includes(c)) return 'RX';
  if (['TAC', 'TAC01'].includes(c)) return 'TAC';
  if (c === 'MAMO') return 'MAMOGRAFIA';
  return 'OTROS';
};

export const parseDateTime = (dateStr: string, timeStr?: string): Date | null => {
  if (!dateStr) return null;
  
  // If dateStr contains both date and time (e.g. "03/05/2026 7:00:00 AM")
  if (dateStr.includes('AM') || dateStr.includes('PM') || (dateStr.includes(':') && dateStr.length > 10)) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  }

  // If we have separate date and time
  if (timeStr) {
    // Combine "DD/MM/YYYY" and "HH:MM:SS"
    // JS Date expects "MM/DD/YYYY" or "YYYY-MM-DD"
    // Let's try to normalize
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const normalizedDate = `${parts[1]}/${parts[0]}/${parts[2]}`; // MM/DD/YYYY
      const d = new Date(`${normalizedDate} ${timeStr}`);
      if (!isNaN(d.getTime())) return d;
    }
  }

  const d = new Date(dateStr);
  return !isNaN(d.getTime()) ? d : null;
};

export type AppointmentStatus = 'ATTENDED' | 'REAL_INASISTENCIA' | 'REITERATED_NO_SHOW' | 'PENDING' | 'REASSIGNED' | 'CANCELLED';

export const getAppointmentStatus = (item: Appointment, now: Date, allData?: Appointment[]): AppointmentStatus => {
  // Cancelled
  if (item.estdo_rsrva === 'D') return 'CANCELLED';
  
  // Attended (if it has an order number and attention time)
  if (item.nmro_orden !== "0" && item.estdo_rsrva === 'A' && item.hra_atncion !== '00:00:00' && item.hra_atncion !== '') return 'ATTENDED';

  // Inasistencias vs Por Asistir (nmro_orden === "0")
  if (item.nmro_orden === "0") {
    const appointmentTime = parseDateTime(item.fcha, item.hra_incial);
    
    // Check if there are subsequent appointments for the same patient and service
    let hasSubsequent = false;
    if (allData && appointmentTime) {
      hasSubsequent = allData.some(other => {
        if (other === item) return false;
        if (other.id_pcnte === item.id_pcnte) {
          const otherTime = parseDateTime(other.fcha, other.hra_incial);
          return otherTime && otherTime > appointmentTime;
        }
        return false;
      });
    }

    if (!hasSubsequent && appointmentTime && appointmentTime < now) {
      if (item.estdo_rsrva === 'A') return 'REAL_INASISTENCIA';
      if (item.estdo_rsrva === 'R') return 'REITERATED_NO_SHOW';
    }
    
    // If it has subsequent or is in the future
    if (item.estdo_rsrva === 'R') return 'REASSIGNED';
    return 'PENDING';
  }

  // Default fallback
  return 'PENDING';
};

export const calculateOpportunityDays = (item: Appointment): number | null => {
  const fcha = parseDateTime(item.fcha);
  const ingrso = parseDateTime(item.fcha_ingrso);
  const mdfccion = parseDateTime(item.fcha_mdfccion);

  if (!fcha || !ingrso) return null;

  let baseDate = ingrso;
  if (mdfccion && mdfccion > ingrso) {
    baseDate = mdfccion;
  }

  // Calculate difference in days
  const diffTime = fcha.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 ? diffDays : 0;
};

export const calculateStudiesInRange = (start: string, end: string, intervalMinutes: number): number => {
  if (!start || !end) return 0;
  
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
  
  const startTotalMins = h1 * 60 + m1;
  const endTotalMins = h2 * 60 + m2;
  
  const diffMins = endTotalMins - startTotalMins;
  if (diffMins <= 0) return 0;
  
  return Math.floor(diffMins / intervalMinutes);
};
export const getRegistrationDate = (item: Appointment): string | null => {
  const ingrso = parseDateTime(item.fcha_ingrso);
  const mdfccion = parseDateTime(item.fcha_mdfccion);
  
  let latest = ingrso;
  if (mdfccion && (!latest || mdfccion > latest)) {
    latest = mdfccion;
  }
  
  if (!latest) return null;
  
  const m = String(latest.getMonth() + 1).padStart(2, '0');
  const d = String(latest.getDate()).padStart(2, '0');
  const y = latest.getFullYear();
  return `${m}/${d}/${y}`;
};

export const getModificationDate = (item: Appointment): string | null => {
  const mdfccion = parseDateTime(item.fcha_mdfccion);
  if (!mdfccion) return null;
  
  const m = String(mdfccion.getMonth() + 1).padStart(2, '0');
  const d = String(mdfccion.getDate()).padStart(2, '0');
  const y = mdfccion.getFullYear();
  return `${m}/${d}/${y}`;
};

export const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => `"${val}"`).join(',')
  ).join('\n');
  
  const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

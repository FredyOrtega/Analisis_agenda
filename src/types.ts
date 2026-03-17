export interface Appointment {
  cdgo_emprsa: string;
  nmro_orden: string;
  item_orden: string;
  nmro_cta: string;
  cdgo_srvcio_intrno: string;
  id_pcnte: string;
  orgen_cnslta: string;
  nmbre_pcnte: string;
  cdgo_rcrso: string;
  fcha: string;
  hra_incial: string;
  hra_fnal: string;
  hra_atncion: string;
  cdgo_clnte: string;
  edad: number;
  undad_edad: string;
  tlfno: string;
  usrio_ingrso: string;
  fcha_ingrso: string;
  usrio_mdfccion: string;
  fcha_mdfccion: string;
  estdo_rsrva: string;
  cta_smnstrda: string;
  rzon_scial: string;
  cmntrios: string;
  tlfno_movil: string;
  prcio_trfa: number;
}

export interface DashboardStats {
  total: number;
  attended: number;
  noShow: number;
  reiteratedNoShow: number;
  reassigned: number;
  cancelled: number;
  pending: number;
  avgPerDay: number;
}

export interface ConsolidatedRow {
  category: string;
  subCategory?: string;
  total: number;
  attended: number;
  noShow: number;
  reiteratedNoShow: number;
  pending: number;
  reassigned: number;
  totalOpportunityDays: number;
  countForOpportunity: number;
}

export interface DoctorShift {
  id: string;
  start: string;
  end: string;
  isDoppler: boolean;
}

export interface CapacityDayConfig {
  morningDoctors: DoctorShift[];
  afternoonDoctors: DoctorShift[];
}

export interface CapacityConfigState {
  [key: string]: CapacityDayConfig; // key is day name (Lunes, Martes, etc.)
}

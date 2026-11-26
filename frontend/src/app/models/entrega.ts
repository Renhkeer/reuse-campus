// Misma forma que devuelve la API
export interface Entrega {
  id: number;
  publicacionId: number;
  solicitudId: number;
  propietarioId: number;
  receptorId: number;
  fechaAcuerdo: string;
  fechaEntrega: string | null;
  estado: 'PENDIENTE' | 'COMPLETADA';
  publicacion?: string;
  propietario?: string;
  receptor?: string;
}

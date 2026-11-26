// Misma forma que devuelve la API
export interface Solicitud {
  id: number;
  publicacionId: number;
  solicitanteId: number;
  mensaje: string;
  fechaSolicitud: string;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA';
  publicacion?: string;  // título de la publicación
  solicitante?: string;  // nombre del solicitante
}

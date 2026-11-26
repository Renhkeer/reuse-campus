// Misma forma que devuelve la API
export interface Publicacion {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  modalidad: 'DONACION' | 'INTERCAMBIO';
  estado: 'DISPONIBLE' | 'RESERVADA' | 'ENTREGADA' | 'CANCELADA';
  fechaPublicacion: string;
  usuarioId: number;
  propietario?: string; // nombre del dueño (viene del JOIN)
}

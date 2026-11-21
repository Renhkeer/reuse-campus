// Interfaces con la misma forma que devuelve la API

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: 'USUARIO' | 'ADMIN';
  estado: 'ACTIVO' | 'INACTIVO';
}

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

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Entrega, Publicacion, Solicitud, Usuario } from './models';

const URL = 'http://localhost:3000/api';

// Todas las llamadas a la API Express pasan por este servicio
@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);

  // Usuarios
  getUsuarios() {
    return this.http.get<Usuario[]>(`${URL}/usuarios`);
  }

  // Publicaciones
  getPublicaciones(filtros: { estado?: string; usuarioId?: number } = {}) {
    return this.http.get<Publicacion[]>(`${URL}/publicaciones`, { params: filtros });
  }
  getPublicacion(id: number) {
    return this.http.get<Publicacion>(`${URL}/publicaciones/${id}`);
  }
  crearPublicacion(datos: Partial<Publicacion>) {
    return this.http.post<Publicacion>(`${URL}/publicaciones`, datos);
  }
  editarPublicacion(id: number, datos: Partial<Publicacion>) {
    return this.http.put<Publicacion>(`${URL}/publicaciones/${id}`, datos);
  }
  cancelarPublicacion(id: number) {
    return this.http.delete(`${URL}/publicaciones/${id}`);
  }

  // Solicitudes
  getSolicitudes(filtros: { publicacionId?: number; solicitanteId?: number } = {}) {
    return this.http.get<Solicitud[]>(`${URL}/solicitudes`, { params: filtros });
  }
  crearSolicitud(datos: { publicacionId: number; solicitanteId: number; mensaje: string }) {
    return this.http.post<Solicitud>(`${URL}/solicitudes`, datos);
  }

  // Entregas
  getEntregas(usuarioId?: number) {
    return this.http.get<Entrega[]>(`${URL}/entregas`, { params: usuarioId ? { usuarioId } : {} });
  }
}

// Convierte un error HTTP en un mensaje que el usuario entienda
export function mensajeError(err: HttpErrorResponse): string {
  if (err.status === 0) return 'No se pudo conectar con el servidor. ¿Está encendida la API?';
  return err.error?.mensaje || 'Ocurrió un error inesperado';
}

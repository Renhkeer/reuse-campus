import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Entrega, Publicacion, Solicitud, Usuario } from './models';

const URL = 'http://localhost:3000/api';

// Todas las llamadas a la API Express pasan por este servicio.
// El token lo agrega tokenInterceptor (auth.ts); el usuario lo saca la API del token.
@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);

  // Login
  login(correo: string, password: string) {
    return this.http.post<{ token: string; usuario: Usuario }>(`${URL}/auth/login`, { correo, password });
  }

  // Usuarios (solo admin)
  getUsuarios() {
    return this.http.get<Usuario[]>(`${URL}/usuarios`);
  }
  crearUsuario(datos: { nombre: string; correo: string; password: string; rol: string }) {
    return this.http.post<Usuario>(`${URL}/usuarios`, datos);
  }
  desactivarUsuario(id: number) {
    return this.http.delete(`${URL}/usuarios/${id}`);
  }
  activarUsuario(id: number) {
    return this.http.patch<Usuario>(`${URL}/usuarios/${id}/activar`, {});
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
  crearSolicitud(datos: { publicacionId: number; mensaje: string }) {
    return this.http.post<Solicitud>(`${URL}/solicitudes`, datos);
  }
  aceptarSolicitud(id: number) {
    return this.http.patch<Entrega>(`${URL}/solicitudes/${id}/aceptar`, {});
  }
  rechazarSolicitud(id: number) {
    return this.http.patch<Solicitud>(`${URL}/solicitudes/${id}/rechazar`, {});
  }
  cancelarSolicitud(id: number) {
    return this.http.patch<Solicitud>(`${URL}/solicitudes/${id}/cancelar`, {});
  }

  // Entregas (la API devuelve solo las del usuario; al admin, todas)
  getEntregas() {
    return this.http.get<Entrega[]>(`${URL}/entregas`);
  }
  completarEntrega(id: number) {
    return this.http.patch<Entrega>(`${URL}/entregas/${id}/completar`, {});
  }
}

// Convierte un error HTTP en un mensaje que el usuario entienda
export function mensajeError(err: HttpErrorResponse): string {
  if (err.status === 0) return 'No se pudo conectar con el servidor. ¿Está encendida la API?';
  return err.error?.mensaje || 'Ocurrió un error inesperado';
}

import { Injectable, computed, signal } from '@angular/core';
import { Usuario } from '../models/usuario';

// Guarda quién inició sesión. Se guarda en localStorage para que siga
// conectado al recargar la página.
@Injectable({ providedIn: 'root' })
export class Sesion {
  token = signal<string | null>(localStorage.getItem('token'));
  usuario = signal<Usuario | null>(JSON.parse(localStorage.getItem('usuario') || 'null'));

  esAdmin = computed(() => this.usuario()?.rol === 'ADMIN');

  iniciar(token: string, usuario: Usuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    this.token.set(token);
    this.usuario.set(usuario);
  }

  cerrar() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.token.set(null);
    this.usuario.set(null);
  }
}

import { Injectable, signal } from '@angular/core';
import { Usuario } from './models';

// Usuario con el que se está trabajando.
// Etapa 3: se elige de una lista en la barra superior; en la etapa 5 sale del login.
@Injectable({ providedIn: 'root' })
export class Sesion {
  usuario = signal<Usuario | null>(null);
}

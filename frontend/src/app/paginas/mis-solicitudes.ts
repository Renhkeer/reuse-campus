import { Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Api, mensajeError } from '../api';
import { Sesion } from '../sesion';
import { Solicitud } from '../models';

@Component({
  selector: 'app-mis-solicitudes',
  imports: [DatePipe, RouterLink],
  template: `
    <h1>Mis solicitudes</h1>
    @if (error()) { <p class="error">{{ error() }}</p> }

    @for (s of solicitudes(); track s.id) {
      <div class="tarjeta">
        <a [routerLink]="['/publicaciones', s.publicacionId]"><strong>{{ s.publicacion }}</strong></a>
        <span class="estado" [class]="s.estado">{{ s.estado }}</span>
        <p>{{ s.mensaje }}</p>
        <small>{{ s.fechaSolicitud | date: 'dd/MM/yyyy HH:mm' }}</small>
        <!-- RN16: solo se puede cancelar mientras está PENDIENTE -->
        @if (s.estado === 'PENDIENTE') {
          <p><button class="peligro" (click)="cancelar(s)">Cancelar solicitud</button></p>
        }
      </div>
    } @empty {
      <p>No has hecho solicitudes.</p>
    }
  `
})
export class MisSolicitudes {
  private api = inject(Api);
  private sesion = inject(Sesion);
  solicitudes = signal<Solicitud[]>([]);
  error = signal('');

  constructor() {
    // Se vuelve a cargar cada vez que cambia el usuario
    effect(() => this.cargar());
  }

  cargar() {
    const usuario = this.sesion.usuario();
    if (!usuario) return;
    this.api.getSolicitudes({ solicitanteId: usuario.id }).subscribe({
      next: lista => this.solicitudes.set(lista),
      error: err => this.error.set(mensajeError(err))
    });
  }

  cancelar(s: Solicitud) {
    this.error.set('');
    this.api.cancelarSolicitud(s.id, this.sesion.usuario()!.id).subscribe({
      next: () => this.cargar(),
      error: err => this.error.set(mensajeError(err))
    });
  }
}

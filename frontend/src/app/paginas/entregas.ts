import { Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Api, mensajeError } from '../api';
import { Sesion } from '../sesion';
import { Entrega } from '../models';

@Component({
  selector: 'app-entregas',
  imports: [DatePipe, RouterLink],
  template: `
    <h1>Mis entregas</h1>
    @if (error()) { <p class="error">{{ error() }}</p> }
    @if (mensaje()) { <p class="exito">{{ mensaje() }}</p> }

    @for (e of entregas(); track e.id) {
      <div class="tarjeta">
        <a [routerLink]="['/publicaciones', e.publicacionId]"><strong>{{ e.publicacion }}</strong></a>
        <span class="estado" [class]="e.estado">{{ e.estado }}</span>
        <p>De <b>{{ e.propietario }}</b> para <b>{{ e.receptor }}</b></p>
        <small>
          Acordada el {{ e.fechaAcuerdo | date: 'dd/MM/yyyy HH:mm' }}
          @if (e.fechaEntrega) { · entregada el {{ e.fechaEntrega | date: 'dd/MM/yyyy HH:mm' }} }
        </small>
        <!-- El propietario confirma cuando ya entregó el artículo (RN14) -->
        @if (e.estado === 'PENDIENTE' && e.propietarioId === sesion.usuario()?.id) {
          <p><button (click)="completar(e)">Confirmar entrega</button></p>
        }
      </div>
    } @empty {
      <p>No tienes entregas.</p>
    }
  `
})
export class Entregas {
  private api = inject(Api);
  sesion = inject(Sesion);
  entregas = signal<Entrega[]>([]);
  error = signal('');
  mensaje = signal('');

  constructor() {
    // Se vuelve a cargar cada vez que cambia el usuario
    effect(() => this.cargar());
  }

  cargar() {
    const usuario = this.sesion.usuario();
    if (!usuario) return;
    this.api.getEntregas(usuario.id).subscribe({
      next: lista => this.entregas.set(lista),
      error: err => this.error.set(mensajeError(err))
    });
  }

  completar(e: Entrega) {
    if (!confirm('¿Confirmas que el artículo ya fue entregado?')) return;
    this.error.set('');
    this.api.completarEntrega(e.id, this.sesion.usuario()!.id).subscribe({
      next: () => {
        this.mensaje.set('Entrega completada: la publicación quedó ENTREGADA');
        this.cargar();
      },
      error: err => this.error.set(mensajeError(err))
    });
  }
}

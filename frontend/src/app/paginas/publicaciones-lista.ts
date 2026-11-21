import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Api, mensajeError } from '../api';
import { Publicacion } from '../models';

@Component({
  selector: 'app-publicaciones-lista',
  imports: [RouterLink, DatePipe],
  template: `
    <h1>Publicaciones</h1>

    <label>
      Filtrar por estado:
      <select (change)="filtrar($any($event.target).value)">
        <option value="">Todas</option>
        <option value="DISPONIBLE">Disponibles</option>
        <option value="RESERVADA">Reservadas</option>
        <option value="ENTREGADA">Entregadas</option>
        <option value="CANCELADA">Canceladas</option>
      </select>
    </label>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @for (p of publicaciones(); track p.id) {
      <div class="tarjeta">
        <a [routerLink]="['/publicaciones', p.id]"><h3>{{ p.titulo }}</h3></a>
        <span class="estado" [class]="p.estado">{{ p.estado }}</span>
        {{ p.modalidad }} · {{ p.categoria }}
        <p>{{ p.descripcion }}</p>
        <small>Publicado por {{ p.propietario }} el {{ p.fechaPublicacion | date: 'dd/MM/yyyy HH:mm' }}</small>
      </div>
    } @empty {
      <p>No hay publicaciones.</p>
    }
  `
})
export class PublicacionesLista implements OnInit {
  private api = inject(Api);
  publicaciones = signal<Publicacion[]>([]);
  error = signal('');

  ngOnInit() {
    this.filtrar('');
  }

  filtrar(estado: string) {
    this.api.getPublicaciones(estado ? { estado } : {}).subscribe({
      next: lista => this.publicaciones.set(lista),
      error: err => this.error.set(mensajeError(err))
    });
  }
}

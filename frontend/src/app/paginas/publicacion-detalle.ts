import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api, mensajeError } from '../api';
import { Sesion } from '../sesion';
import { Publicacion, Solicitud } from '../models';

@Component({
  selector: 'app-publicacion-detalle',
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    @if (error()) { <p class="error">{{ error() }}</p> }
    @if (mensaje()) { <p class="exito">{{ mensaje() }}</p> }

    @if (publicacion(); as p) {
      <div class="tarjeta">
        <h1>{{ p.titulo }}</h1>
        <span class="estado" [class]="p.estado">{{ p.estado }}</span>
        {{ p.modalidad }} · {{ p.categoria }}
        <p>{{ p.descripcion }}</p>
        <small>Publicado por {{ p.propietario }} el {{ p.fechaPublicacion | date: 'dd/MM/yyyy HH:mm' }}</small>
        <p>
          <a class="boton" [routerLink]="['/publicaciones', p.id, 'editar']">Editar</a>
        </p>
      </div>

      <h2>Solicitar este artículo</h2>
      <div class="tarjeta">
        <textarea [(ngModel)]="nuevoMensaje" rows="3" maxlength="300"
                  placeholder="Cuéntale al dueño por qué te sirve"></textarea>
        <button (click)="solicitar()" [disabled]="!nuevoMensaje.trim()">Enviar solicitud</button>
      </div>

      <h2>Solicitudes recibidas</h2>
      @for (s of solicitudes(); track s.id) {
        <div class="tarjeta">
          <strong>{{ s.solicitante }}</strong>
          <span class="estado" [class]="s.estado">{{ s.estado }}</span>
          <p>{{ s.mensaje }}</p>
          <small>{{ s.fechaSolicitud | date: 'dd/MM/yyyy HH:mm' }}</small>
        </div>
      } @empty {
        <p>Todavía no hay solicitudes.</p>
      }
    }
  `
})
export class PublicacionDetalle implements OnInit {
  private api = inject(Api);
  private sesion = inject(Sesion);
  private id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  publicacion = signal<Publicacion | null>(null);
  solicitudes = signal<Solicitud[]>([]);
  error = signal('');
  mensaje = signal('');
  nuevoMensaje = '';

  ngOnInit() {
    this.cargar();
  }

  // Trae la publicación y sus solicitudes desde la API
  cargar() {
    this.api.getPublicacion(this.id).subscribe({
      next: p => this.publicacion.set(p),
      error: err => this.error.set(mensajeError(err))
    });
    this.api.getSolicitudes({ publicacionId: this.id }).subscribe({
      next: lista => this.solicitudes.set(lista),
      error: err => this.error.set(mensajeError(err))
    });
  }

  solicitar() {
    this.error.set('');
    this.mensaje.set('');
    const datos = { publicacionId: this.id, solicitanteId: this.sesion.usuario()!.id, mensaje: this.nuevoMensaje };
    this.api.crearSolicitud(datos).subscribe({
      next: () => {
        this.mensaje.set('Solicitud enviada');
        this.nuevoMensaje = '';
        this.cargar(); // se recarga para ver la nueva solicitud en la lista
      },
      error: err => this.error.set(mensajeError(err))
    });
  }
}

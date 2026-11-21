import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
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

        <!-- Solo el dueño ve estos botones, y solo si sigue DISPONIBLE (el backend lo valida igual) -->
        @if (esDueno() && p.estado === 'DISPONIBLE') {
          <p>
            <a class="boton" [routerLink]="['/publicaciones', p.id, 'editar']">Editar</a>
            <button class="peligro" (click)="cancelarPublicacion()">Cancelar publicación</button>
          </p>
        }
      </div>

      <!-- RN03 y RN04: no se muestra el formulario al dueño ni si no está DISPONIBLE -->
      @if (!esDueno() && p.estado === 'DISPONIBLE') {
        <h2>Solicitar este artículo</h2>
        <div class="tarjeta">
          <textarea [(ngModel)]="nuevoMensaje" rows="3" maxlength="300"
                    placeholder="Cuéntale al dueño por qué te sirve"></textarea>
          <button (click)="solicitar()" [disabled]="!nuevoMensaje.trim()">Enviar solicitud</button>
        </div>
      }

      <h2>Solicitudes</h2>
      @for (s of solicitudes(); track s.id) {
        <div class="tarjeta">
          <strong>{{ s.solicitante }}</strong>
          <span class="estado" [class]="s.estado">{{ s.estado }}</span>
          <p>{{ s.mensaje }}</p>
          <small>{{ s.fechaSolicitud | date: 'dd/MM/yyyy HH:mm' }}</small>

          @if (esDueno() && s.estado === 'PENDIENTE' && p.estado === 'DISPONIBLE') {
            <p>
              <button (click)="aceptar(s)">Aceptar</button>
              <button class="secundario" (click)="rechazar(s)">Rechazar</button>
            </p>
          }
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
  private router = inject(Router);
  private id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  publicacion = signal<Publicacion | null>(null);
  solicitudes = signal<Solicitud[]>([]);
  error = signal('');
  mensaje = signal('');
  nuevoMensaje = '';

  // Se recalcula solo cuando cambia el usuario o la publicación
  esDueno = computed(() => this.publicacion()?.usuarioId === this.sesion.usuario()?.id);

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

  // Ejecuta una acción, muestra el resultado y recarga los datos
  private ejecutar(peticion: Observable<unknown>, textoExito: string) {
    this.error.set('');
    this.mensaje.set('');
    peticion.subscribe({
      next: () => {
        this.mensaje.set(textoExito);
        this.cargar();
      },
      error: err => this.error.set(mensajeError(err))
    });
  }

  private usuarioId() {
    return this.sesion.usuario()!.id;
  }

  solicitar() {
    const datos = { publicacionId: this.id, solicitanteId: this.usuarioId(), mensaje: this.nuevoMensaje };
    this.ejecutar(this.api.crearSolicitud(datos), 'Solicitud enviada');
    this.nuevoMensaje = '';
  }

  aceptar(s: Solicitud) {
    if (!confirm(`¿Aceptar la solicitud de ${s.solicitante}? Las demás pendientes se rechazarán.`)) return;
    this.ejecutar(this.api.aceptarSolicitud(s.id, this.usuarioId()),
      'Solicitud aceptada: la publicación quedó RESERVADA y se creó la entrega');
  }

  rechazar(s: Solicitud) {
    this.ejecutar(this.api.rechazarSolicitud(s.id, this.usuarioId()), 'Solicitud rechazada');
  }

  cancelarPublicacion() {
    if (!confirm('¿Cancelar esta publicación?')) return;
    this.api.cancelarPublicacion(this.id, this.usuarioId()).subscribe({
      next: () => this.router.navigate(['/']),
      error: err => this.error.set(mensajeError(err))
    });
  }
}

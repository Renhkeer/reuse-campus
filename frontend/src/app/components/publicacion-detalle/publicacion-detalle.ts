import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Api, mensajeError } from '../../services/api';
import { Sesion } from '../../services/sesion';
import { Publicacion } from '../../models/publicacion';
import { Solicitud } from '../../models/solicitud';

@Component({
  selector: 'app-publicacion-detalle',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './publicacion-detalle.html',
  styleUrl: './publicacion-detalle.css'
})
export class PublicacionDetalle implements OnInit {
  private api = inject(Api);
  sesion = inject(Sesion);
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

  solicitar() {
    const datos = { publicacionId: this.id, mensaje: this.nuevoMensaje };
    this.ejecutar(this.api.crearSolicitud(datos), 'Solicitud enviada');
    this.nuevoMensaje = '';
  }

  aceptar(s: Solicitud) {
    if (!confirm(`¿Aceptar la solicitud de ${s.solicitante}? Las demás pendientes se rechazarán.`)) return;
    this.ejecutar(this.api.aceptarSolicitud(s.id),
      'Solicitud aceptada: la publicación quedó RESERVADA y se creó la entrega');
  }

  rechazar(s: Solicitud) {
    this.ejecutar(this.api.rechazarSolicitud(s.id), 'Solicitud rechazada');
  }

  cancelarPublicacion() {
    if (!confirm('¿Cancelar esta publicación?')) return;
    this.api.cancelarPublicacion(this.id).subscribe({
      next: () => this.router.navigate(['/']),
      error: err => this.error.set(mensajeError(err))
    });
  }
}

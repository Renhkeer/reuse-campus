import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Api, mensajeError } from '../../services/api';
import { Sesion } from '../../services/sesion';
import { Solicitud } from '../../models/solicitud';

@Component({
  selector: 'app-mis-solicitudes',
  imports: [DatePipe, RouterLink],
  templateUrl: './mis-solicitudes.html',
  styleUrl: './mis-solicitudes.css'
})
export class MisSolicitudes implements OnInit {
  private api = inject(Api);
  private sesion = inject(Sesion);
  solicitudes = signal<Solicitud[]>([]);
  error = signal('');

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.api.getSolicitudes({ solicitanteId: this.sesion.usuario()!.id }).subscribe({
      next: lista => this.solicitudes.set(lista),
      error: err => this.error.set(mensajeError(err))
    });
  }

  cancelar(s: Solicitud) {
    this.error.set('');
    this.api.cancelarSolicitud(s.id).subscribe({
      next: () => this.cargar(),
      error: err => this.error.set(mensajeError(err))
    });
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Api, mensajeError } from '../../services/api';
import { Sesion } from '../../services/sesion';
import { Entrega } from '../../models/entrega';

@Component({
  selector: 'app-entregas',
  imports: [DatePipe, RouterLink],
  templateUrl: './entregas.html',
  styleUrl: './entregas.css'
})
export class Entregas implements OnInit {
  private api = inject(Api);
  sesion = inject(Sesion);
  entregas = signal<Entrega[]>([]);
  error = signal('');
  mensaje = signal('');

  ngOnInit() {
    this.cargar();
  }

  // La API devuelve solo las entregas del usuario (o todas si es admin)
  cargar() {
    this.api.getEntregas().subscribe({
      next: lista => this.entregas.set(lista),
      error: err => this.error.set(mensajeError(err))
    });
  }

  completar(e: Entrega) {
    if (!confirm('¿Confirmas que el artículo ya fue entregado?')) return;
    this.error.set('');
    this.api.completarEntrega(e.id).subscribe({
      next: () => {
        this.mensaje.set('Entrega completada: la publicación quedó ENTREGADA');
        this.cargar();
      },
      error: err => this.error.set(mensajeError(err))
    });
  }
}

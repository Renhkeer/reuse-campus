import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Api, mensajeError } from '../../services/api';
import { Publicacion } from '../../models/publicacion';

@Component({
  selector: 'app-publicaciones-lista',
  imports: [RouterLink, DatePipe],
  templateUrl: './publicaciones-lista.html',
  styleUrl: './publicaciones-lista.css'
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

import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Api, mensajeError } from './api';
import { Sesion } from './sesion';
import { Usuario } from './models';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private api = inject(Api);
  sesion = inject(Sesion);
  usuarios = signal<Usuario[]>([]);
  error = signal('');

  ngOnInit() {
    this.api.getUsuarios().subscribe({
      next: lista => {
        this.usuarios.set(lista);
        this.sesion.usuario.set(lista[0] ?? null);
      },
      error: err => this.error.set(mensajeError(err))
    });
  }

  cambiarUsuario(id: string) {
    this.sesion.usuario.set(this.usuarios().find(u => u.id === Number(id)) ?? null);
  }
}

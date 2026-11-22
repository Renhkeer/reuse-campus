import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { Api, mensajeError } from '../api';
import { Sesion } from '../sesion';
import { Usuario } from '../models';

// Página solo para el administrador: ver, crear, activar y desactivar usuarios
@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule],
  template: `
    <h1>Usuarios</h1>
    @if (error()) { <p class="error">{{ error() }}</p> }
    @if (mensaje()) { <p class="exito">{{ mensaje() }}</p> }

    <table class="tarjeta">
      <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th></th></tr>
      @for (u of usuarios(); track u.id) {
        <tr>
          <td>{{ u.nombre }}</td>
          <td>{{ u.correo }}</td>
          <td>{{ u.rol }}</td>
          <td><span class="estado" [class]="u.estado">{{ u.estado }}</span></td>
          <td>
            @if (u.id !== sesion.usuario()?.id) {
              @if (u.estado === 'ACTIVO') {
                <button class="peligro" (click)="desactivar(u)">Desactivar</button>
              } @else {
                <button (click)="activar(u)">Activar</button>
              }
            }
          </td>
        </tr>
      }
    </table>

    <h2>Nuevo usuario</h2>
    <form class="tarjeta" [formGroup]="form" (ngSubmit)="crear()">
      <label>Nombre</label>
      <input formControlName="nombre" maxlength="100" />
      <label>Correo</label>
      <input type="email" formControlName="correo" maxlength="150" />
      <label>Contraseña (mínimo 6)</label>
      <input type="password" formControlName="password" autocomplete="new-password" />
      <label>Rol</label>
      <select formControlName="rol">
        <option value="USUARIO">Usuario</option>
        <option value="ADMIN">Administrador</option>
      </select>
      @if (form.invalid && form.touched) {
        <p class="campo-error">Completa todos los campos (correo válido y contraseña de 6 o más)</p>
      }
      <button type="submit">Crear</button>
    </form>
  `,
  styles: `
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 6px; border-bottom: 1px solid #eee; }
    .estado.ACTIVO { background: #c8e6c9; }
    .estado.INACTIVO { background: #ffcdd2; }
  `
})
export class Usuarios implements OnInit {
  private api = inject(Api);
  sesion = inject(Sesion);
  usuarios = signal<Usuario[]>([]);
  error = signal('');
  mensaje = signal('');

  form = inject(FormBuilder).nonNullable.group({
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rol: ['USUARIO' as 'USUARIO' | 'ADMIN']
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.api.getUsuarios().subscribe({
      next: lista => this.usuarios.set(lista),
      error: err => this.error.set(mensajeError(err))
    });
  }

  // Ejecuta una acción, muestra el resultado y recarga la tabla
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

  desactivar(u: Usuario) {
    this.ejecutar(this.api.desactivarUsuario(u.id), `${u.nombre} quedó INACTIVO`);
  }

  activar(u: Usuario) {
    this.ejecutar(this.api.activarUsuario(u.id), `${u.nombre} quedó ACTIVO`);
  }

  crear() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set('');
    this.api.crearUsuario(this.form.getRawValue()).subscribe({
      next: () => {
        this.mensaje.set('Usuario creado');
        this.form.reset(); // solo se limpia si se guardó, para no perder lo escrito
        this.cargar();
      },
      error: err => this.error.set(mensajeError(err))
    });
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { Api, mensajeError } from '../../services/api';
import { Sesion } from '../../services/sesion';
import { Usuario } from '../../models/usuario';

// Página solo para el administrador: ver, crear, activar y desactivar usuarios
@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
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

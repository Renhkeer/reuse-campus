import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Api, mensajeError } from '../api';
import { Sesion } from '../sesion';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <form class="tarjeta login" [formGroup]="form" (ngSubmit)="entrar()">
      <h1>Iniciar sesión</h1>

      <label>Correo</label>
      <input type="email" formControlName="correo" autocomplete="username" />
      @if (form.controls.correo.invalid && form.controls.correo.touched) {
        <p class="campo-error">Ingresa un correo válido</p>
      }

      <label>Contraseña</label>
      <input type="password" formControlName="password" autocomplete="current-password" />
      @if (form.controls.password.invalid && form.controls.password.touched) {
        <p class="campo-error">La contraseña es obligatoria</p>
      }

      @if (error()) { <p class="error">{{ error() }}</p> }

      <button type="submit">Entrar</button>
    </form>
  `,
  styles: `.login { max-width: 360px; margin: 40px auto; }`
})
export class Login {
  private api = inject(Api);
  private sesion = inject(Sesion);
  private router = inject(Router);
  error = signal('');

  form = inject(FormBuilder).nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  entrar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set('');
    const { correo, password } = this.form.getRawValue();
    this.api.login(correo, password).subscribe({
      next: res => {
        this.sesion.iniciar(res.token, res.usuario);
        this.router.navigate(['/']);
      },
      error: err => this.error.set(mensajeError(err))
    });
  }
}

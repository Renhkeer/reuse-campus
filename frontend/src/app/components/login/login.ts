import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Api, mensajeError } from '../../services/api';
import { Sesion } from '../../services/sesion';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
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

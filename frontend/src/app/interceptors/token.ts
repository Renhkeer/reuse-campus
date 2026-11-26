import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Sesion } from '../services/sesion';

// Agrega el token a cada petición. Si la API responde 401 (sesión vencida), vuelve al login.
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion = inject(Sesion);
  const router = inject(Router);
  const token = sesion.token();

  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError(err => {
      if (err.status === 401 && token) {
        sesion.cerrar();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};

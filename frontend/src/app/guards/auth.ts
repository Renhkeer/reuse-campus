import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sesion } from '../services/sesion';

// Guard: sin sesión iniciada manda al login
export const requiereLogin: CanActivateFn = () => {
  return inject(Sesion).token() ? true : inject(Router).createUrlTree(['/login']);
};

// Guard: solo el administrador entra. Ocultar el link no basta: el backend también lo valida (RN18)
export const soloAdmin: CanActivateFn = () => {
  return inject(Sesion).esAdmin() ? true : inject(Router).createUrlTree(['/']);
};

import { Routes } from '@angular/router';
import { requiereLogin, soloAdmin } from './guards/auth';
import { Login } from './components/login/login';
import { PublicacionesLista } from './components/publicaciones-lista/publicaciones-lista';
import { PublicacionDetalle } from './components/publicacion-detalle/publicacion-detalle';
import { PublicacionFormulario } from './components/publicacion-formulario/publicacion-formulario';
import { MisSolicitudes } from './components/mis-solicitudes/mis-solicitudes';
import { Entregas } from './components/entregas/entregas';
import { Usuarios } from './components/usuarios/usuarios';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: '', component: PublicacionesLista, canActivate: [requiereLogin] },
  { path: 'publicaciones/nueva', component: PublicacionFormulario, canActivate: [requiereLogin] },
  { path: 'publicaciones/:id', component: PublicacionDetalle, canActivate: [requiereLogin] },
  { path: 'publicaciones/:id/editar', component: PublicacionFormulario, canActivate: [requiereLogin] },
  { path: 'mis-solicitudes', component: MisSolicitudes, canActivate: [requiereLogin] },
  { path: 'entregas', component: Entregas, canActivate: [requiereLogin] },
  { path: 'usuarios', component: Usuarios, canActivate: [requiereLogin, soloAdmin] },
  { path: '**', redirectTo: '' }
];

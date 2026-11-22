import { Routes } from '@angular/router';
import { requiereLogin, soloAdmin } from './auth';
import { Login } from './paginas/login';
import { PublicacionesLista } from './paginas/publicaciones-lista';
import { PublicacionDetalle } from './paginas/publicacion-detalle';
import { PublicacionFormulario } from './paginas/publicacion-formulario';
import { MisSolicitudes } from './paginas/mis-solicitudes';
import { Entregas } from './paginas/entregas';
import { Usuarios } from './paginas/usuarios';

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

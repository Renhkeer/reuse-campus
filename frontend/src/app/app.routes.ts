import { Routes } from '@angular/router';
import { PublicacionesLista } from './paginas/publicaciones-lista';
import { PublicacionDetalle } from './paginas/publicacion-detalle';
import { PublicacionFormulario } from './paginas/publicacion-formulario';
import { MisSolicitudes } from './paginas/mis-solicitudes';
import { Entregas } from './paginas/entregas';

export const routes: Routes = [
  { path: '', component: PublicacionesLista },
  { path: 'publicaciones/nueva', component: PublicacionFormulario },
  { path: 'publicaciones/:id', component: PublicacionDetalle },
  { path: 'publicaciones/:id/editar', component: PublicacionFormulario },
  { path: 'mis-solicitudes', component: MisSolicitudes },
  { path: 'entregas', component: Entregas },
  { path: '**', redirectTo: '' }
];

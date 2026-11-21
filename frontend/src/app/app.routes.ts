import { Routes } from '@angular/router';
import { PublicacionesLista } from './paginas/publicaciones-lista';
import { PublicacionDetalle } from './paginas/publicacion-detalle';
import { PublicacionFormulario } from './paginas/publicacion-formulario';

export const routes: Routes = [
  { path: '', component: PublicacionesLista },
  { path: 'publicaciones/nueva', component: PublicacionFormulario },
  { path: 'publicaciones/:id', component: PublicacionDetalle },
  { path: 'publicaciones/:id/editar', component: PublicacionFormulario },
  { path: '**', redirectTo: '' }
];

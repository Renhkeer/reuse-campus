import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sesion } from '../../services/sesion';

// Links de navegación; el de Usuarios solo lo ve el administrador
@Component({
  selector: 'app-menu',
  imports: [RouterLink],
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class Menu {
  sesion = inject(Sesion);
}

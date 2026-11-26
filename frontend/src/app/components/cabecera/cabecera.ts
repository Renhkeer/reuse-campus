import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Sesion } from '../../services/sesion';
import { Menu } from '../menu/menu';

// Barra superior: logo, menú y usuario conectado con su botón para salir
@Component({
  selector: 'app-cabecera',
  imports: [RouterLink, Menu],
  templateUrl: './cabecera.html',
  styleUrl: './cabecera.css'
})
export class Cabecera {
  private router = inject(Router);
  sesion = inject(Sesion);

  salir() {
    this.sesion.cerrar();
    this.router.navigate(['/login']);
  }
}

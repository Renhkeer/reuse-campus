import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Sesion } from './sesion';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);
  sesion = inject(Sesion);

  salir() {
    this.sesion.cerrar();
    this.router.navigate(['/login']);
  }
}

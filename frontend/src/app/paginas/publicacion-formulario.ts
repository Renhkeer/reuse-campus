import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api, mensajeError } from '../api';
import { Sesion } from '../sesion';

// Sirve para crear (/publicaciones/nueva) y para editar (/publicaciones/:id/editar)
@Component({
  selector: 'app-publicacion-formulario',
  imports: [ReactiveFormsModule],
  template: `
    <h1>{{ id ? 'Editar publicación' : 'Nueva publicación' }}</h1>

    <form class="tarjeta" [formGroup]="form" (ngSubmit)="guardar()">
      <label>Título</label>
      <input formControlName="titulo" maxlength="100" />
      @if (invalido('titulo')) { <p class="campo-error">El título es obligatorio</p> }

      <label>Descripción</label>
      <textarea formControlName="descripcion" rows="4" maxlength="500"></textarea>
      @if (invalido('descripcion')) { <p class="campo-error">La descripción es obligatoria</p> }

      <label>Categoría</label>
      <select formControlName="categoria">
        <option value="">-- Elige --</option>
        @for (c of categorias; track c) { <option [value]="c">{{ c }}</option> }
      </select>
      @if (invalido('categoria')) { <p class="campo-error">Elige una categoría</p> }

      <label>Modalidad</label>
      <select formControlName="modalidad">
        <option value="DONACION">Donación</option>
        <option value="INTERCAMBIO">Intercambio</option>
      </select>

      @if (error()) { <p class="error">{{ error() }}</p> }

      <button type="submit">Guardar</button>
    </form>
  `
})
export class PublicacionFormulario implements OnInit {
  private api = inject(Api);
  private sesion = inject(Sesion);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  id = Number(this.route.snapshot.paramMap.get('id')) || null;
  categorias = ['Libros', 'Calculadoras', 'Componentes', 'Accesorios', 'Materiales', 'Otros'];
  error = signal('');

  form = inject(FormBuilder).nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.required, Validators.maxLength(500)]],
    categoria: ['', Validators.required],
    modalidad: ['DONACION' as 'DONACION' | 'INTERCAMBIO', Validators.required]
  });

  ngOnInit() {
    // Si es edición, se cargan los datos actuales en el formulario
    if (this.id) {
      this.api.getPublicacion(this.id).subscribe({
        next: p => this.form.patchValue(p),
        error: err => this.error.set(mensajeError(err))
      });
    }
  }

  // Muestra el error solo después de que el usuario tocó el campo
  invalido(campo: string) {
    const control = this.form.get(campo)!;
    return control.invalid && control.touched;
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = this.form.getRawValue();
    const peticion = this.id
      ? this.api.editarPublicacion(this.id, datos)
      : this.api.crearPublicacion({ ...datos, usuarioId: this.sesion.usuario()?.id });

    peticion.subscribe({
      next: p => this.router.navigate(['/publicaciones', p.id]),
      error: err => this.error.set(mensajeError(err))
    });
  }
}

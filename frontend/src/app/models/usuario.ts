// Misma forma que devuelve la API
export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: 'USUARIO' | 'ADMIN';
  estado: 'ACTIVO' | 'INACTIVO';
}

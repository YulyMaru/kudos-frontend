import { Rol } from './sesion';

export interface FacultadVista {
  readonly id: string;
  readonly nombre: string;
  readonly activa: boolean;
}

export interface ProgramaVista {
  readonly id: string;
  readonly facultadId: string;
  readonly nombre: string;
  readonly activo: boolean;
}

export interface SolicitudRegistro {
  readonly nombreCompleto: string;
  readonly correo: string;
  readonly celular: string;
  readonly rol: Rol;
  readonly facultadId: string | null;
  readonly programaId: string | null;
  readonly contrasena: string;
  readonly aceptaPolitica: boolean;
}

export type CanalVerificacion = 'CORREO' | 'CELULAR';

export interface MensajeRespuesta {
  readonly mensaje: string;
}

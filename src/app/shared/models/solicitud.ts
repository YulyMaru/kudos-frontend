import { Rol } from './sesion';

export interface SolicitudPendiente {
  readonly id: string;
  readonly usuarioId: string;
  readonly nombreCompleto: string;
  readonly correo: string;
  readonly rolSolicitado: Rol;
  readonly facultad: string | null;
  readonly programa: string | null;
  readonly correoVerificado: boolean;
  readonly celularVerificado: boolean;
  readonly creadaEn: string;
}

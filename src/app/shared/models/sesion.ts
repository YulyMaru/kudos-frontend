export type Rol =
  | 'ADMINISTRADOR'
  | 'RECTOR'
  | 'COORDINADOR_ACADEMICO'
  | 'COORDINADOR_FACULTAD'
  | 'COORDINADOR_PROGRAMA'
  | 'DOCENTE'
  | 'ESTUDIANTE';

export const ROLES_ADMINISTRACION: readonly Rol[] = [
  'ADMINISTRADOR',
  'RECTOR',
  'COORDINADOR_ACADEMICO',
  'COORDINADOR_FACULTAD',
  'COORDINADOR_PROGRAMA',
];

export interface SesionRespuesta {
  readonly tokenAcceso: string;
  readonly tipoToken: string;
  readonly expiraEn: string;
  readonly tokenRefresco: string;
  readonly expiraRefrescoEn: string;
  readonly usuarioId: string;
  readonly nombreCompleto: string;
  readonly rol: Rol;
}

export interface UsuarioActual {
  readonly id: string;
  readonly nombreCompleto: string;
  readonly rol: Rol;
}

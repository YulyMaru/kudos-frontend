import { PersonaVista } from './kudo';

export type TipoContenido = 'KUDO' | 'REPLICA';

export interface ReplicaVista {
  readonly id: string;
  readonly kudoId: string;
  readonly replicaPadreId: string | null;
  readonly autor: PersonaVista;
  readonly contenido: string;
  readonly fechaPublicacion: string;
  readonly cantidadRespuestas: number;
  readonly promedioCalificacion: number;
  readonly cantidadCalificaciones: number;
}

export interface PaginaReplicas {
  readonly replicas: readonly ReplicaVista[];
  readonly siguienteCursor: string | null;
}

export interface ReplicaPublicada {
  readonly id: string;
  readonly kudoId: string;
  readonly replicaPadreId: string | null;
  readonly fechaPublicacion: string;
}

export interface ResumenCalificacion {
  readonly tipoContenido: TipoContenido;
  readonly contenidoId: string;
  readonly promedio: number;
  readonly cantidad: number;
  readonly miCalificacion: number | null;
}

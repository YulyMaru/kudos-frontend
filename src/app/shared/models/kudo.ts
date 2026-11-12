import { Rol } from './sesion';

export interface PersonaVista {
  readonly id: string;
  readonly nombreCompleto: string;
  readonly rol: Rol;
}

export interface CategoriaVista {
  readonly id: string;
  readonly nombre: string;
}

export interface KudoResumenVista {
  readonly id: string;
  readonly autor: PersonaVista;
  readonly destinatario: PersonaVista;
  readonly categoria: CategoriaVista;
  readonly extracto: string;
  readonly contenidoTruncado: boolean;
  readonly fechaPublicacion: string;
  readonly cantidadAdjuntos: number;
  readonly cantidadReplicas: number;
  readonly promedioCalificacion: number;
  readonly cantidadCalificaciones: number;
}

export interface PaginaFeed {
  readonly kudos: readonly KudoResumenVista[];
  readonly siguienteCursor: string | null;
}

export interface AdjuntoVista {
  readonly id: string;
  readonly nombreOriginal: string;
  readonly tipoContenido: string;
  readonly tamanoBytes: number;
}

export interface KudoDetalleVista {
  readonly id: string;
  readonly autor: PersonaVista;
  readonly destinatario: PersonaVista;
  readonly categoria: CategoriaVista;
  readonly contenido: string;
  readonly fechaPublicacion: string;
  readonly adjuntos: readonly AdjuntoVista[];
  readonly cantidadReplicas: number;
  readonly promedioCalificacion: number;
  readonly cantidadCalificaciones: number;
}

export interface EnlaceAdjunto {
  readonly url: string;
  readonly expiraEn: string;
}

export interface KudoPublicadoRespuesta {
  readonly id: string;
  readonly fechaPublicacion: string;
}

export interface NuevoKudo {
  readonly destinatarioId: string;
  readonly categoriaId: string;
  readonly contenido: string;
}

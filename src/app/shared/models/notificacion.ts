export interface NotificacionKudoRecibido {
  readonly tipo: 'KUDO_RECIBIDO';
  readonly idNotificacion: string;
  readonly idKudo: string;
  readonly nombreAutor: string;
  readonly nombreCategoria: string;
}

export type EstadoConexion = 'DESCONECTADO' | 'CONECTANDO' | 'CONECTADO';

import { HttpErrorResponse } from '@angular/common/http';
import { Problema } from '../../shared/models/problema';

export const MENSAJE_SIN_CONEXION = 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.';
export const MENSAJE_INESPERADO = 'Ocurrió un error inesperado. Intenta de nuevo más tarde.';

export function mensajeDeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return MENSAJE_INESPERADO;
  }
  if (error.status === 0) {
    return MENSAJE_SIN_CONEXION;
  }
  const problema = error.error as Problema | null;
  return typeof problema?.detail === 'string' && problema.detail.trim() !== '' ? problema.detail : MENSAJE_INESPERADO;
}

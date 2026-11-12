import { HttpErrorResponse } from '@angular/common/http';
import { MENSAJE_INESPERADO, MENSAJE_SIN_CONEXION, mensajeDeError } from './mensaje-error';

describe('mensajeDeError', () => {
  it('muestra el detail del ProblemDetail del back-end', () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: { title: 'Regla de negocio incumplida', detail: 'No es posible publicar un Kudo para uno mismo' },
    });

    expect(mensajeDeError(error)).toBe('No es posible publicar un Kudo para uno mismo');
  });

  it('avisa cuando no hay conexión con el servidor', () => {
    expect(mensajeDeError(new HttpErrorResponse({ status: 0 }))).toBe(MENSAJE_SIN_CONEXION);
  });

  it('usa un mensaje genérico si no hay detail o el error no es HTTP', () => {
    expect(mensajeDeError(new HttpErrorResponse({ status: 500, error: {} }))).toBe(MENSAJE_INESPERADO);
    expect(mensajeDeError(new Error('x'))).toBe(MENSAJE_INESPERADO);
  });
});

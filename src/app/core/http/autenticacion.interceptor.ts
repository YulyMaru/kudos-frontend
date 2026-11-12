import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SesionService } from '../auth/sesion.service';

export const RUTAS_PUBLICAS: readonly string[] = [
  '/api/v1/auth/iniciar-sesion',
  '/api/v1/auth/refrescar',
  '/api/v1/auth/cerrar-sesion',
  '/api/v1/auth/restablecer/',
  '/api/v1/registro',
  '/api/v1/catalogo/',
];

function rutaDeApi(url: string): string | null {
  const prefijo = `${environment.apiUrl}/api/`;
  return url.startsWith(prefijo) ? url.substring(environment.apiUrl.length) : null;
}

function esPublica(ruta: string): boolean {
  return RUTAS_PUBLICAS.some((publica) => ruta === publica || ruta.startsWith(publica.endsWith('/') ? publica : `${publica}/`));
}

function conToken(peticion: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token === null ? peticion : peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const autenticacionInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const ruta = rutaDeApi(peticion.url);
  if (ruta === null || esPublica(ruta)) {
    return siguiente(peticion);
  }
  const sesion = inject(SesionService);
  return siguiente(conToken(peticion, sesion.tokenAcceso())).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      return sesion.refrescar().pipe(
        catchError(() => {
          sesion.finalizarPorExpiracion();
          return throwError(() => error);
        }),
        switchMap((token) => siguiente(conToken(peticion, token))),
      );
    }),
  );
};

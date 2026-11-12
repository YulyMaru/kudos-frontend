import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RUTA_INICIAR_SESION, SesionService } from '../auth/sesion.service';

export const autenticadoGuard: CanActivateFn = (_ruta, estado) =>
  inject(SesionService).autenticado()
    ? true
    : inject(Router).createUrlTree([RUTA_INICIAR_SESION], { queryParams: { volver: estado.url } });

export const invitadoGuard: CanActivateFn = () =>
  inject(SesionService).autenticado() ? inject(Router).createUrlTree(['/feed']) : true;

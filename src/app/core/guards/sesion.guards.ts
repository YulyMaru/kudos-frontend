import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../../shared/models/sesion';
import { RUTA_INICIAR_SESION, SesionService } from '../auth/sesion.service';

export const autenticadoGuard: CanActivateFn = (_ruta, estado) =>
  inject(SesionService).autenticado()
    ? true
    : inject(Router).createUrlTree([RUTA_INICIAR_SESION], { queryParams: { volver: estado.url } });

export const invitadoGuard: CanActivateFn = () =>
  inject(SesionService).autenticado() ? inject(Router).createUrlTree(['/feed']) : true;

export const rolGuard =
  (roles: readonly Rol[]): CanActivateFn =>
  () => {
    const rol = inject(SesionService).usuario()?.rol;
    return rol !== undefined && roles.includes(rol) ? true : inject(Router).createUrlTree(['/feed']);
  };

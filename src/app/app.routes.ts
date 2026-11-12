import { Routes } from '@angular/router';
import { autenticadoGuard, invitadoGuard, rolGuard } from './core/guards/sesion.guards';
import { ROLES_ADMINISTRACION } from './shared/models/sesion';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'feed' },
  {
    path: 'iniciar-sesion',
    title: 'Iniciar sesión | UCO Kudos',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/iniciar-sesion/iniciar-sesion').then((m) => m.IniciarSesion),
  },
  {
    path: 'registro',
    title: 'Solicitar registro | UCO Kudos',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'verificar',
    title: 'Verificar mis datos | UCO Kudos',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/verificar/verificar').then((m) => m.Verificar),
  },
  {
    path: 'restablecer',
    title: 'Restablecer contraseña | UCO Kudos',
    loadComponent: () => import('./features/auth/restablecer/restablecer').then((m) => m.Restablecer),
  },
  {
    path: 'feed',
    title: 'Inicio | UCO Kudos',
    canActivate: [autenticadoGuard],
    loadComponent: () => import('./features/feed/feed').then((m) => m.Feed),
  },
  {
    path: 'kudos/nuevo',
    title: 'Dar un Kudo | UCO Kudos',
    canActivate: [autenticadoGuard],
    loadComponent: () => import('./features/kudo/publicar-kudo/publicar-kudo').then((m) => m.PublicarKudo),
  },
  {
    path: 'kudos/:id',
    title: 'Kudo | UCO Kudos',
    canActivate: [autenticadoGuard],
    loadComponent: () => import('./features/kudo/detalle-kudo/detalle-kudo').then((m) => m.DetalleKudo),
  },
  {
    path: 'administracion/solicitudes',
    title: 'Solicitudes | UCO Kudos',
    canActivate: [autenticadoGuard, rolGuard(ROLES_ADMINISTRACION)],
    loadComponent: () =>
      import('./features/administracion/solicitudes/solicitudes').then((m) => m.Solicitudes),
  },
  {
    path: '**',
    title: 'Página no encontrada | UCO Kudos',
    loadComponent: () =>
      import('./shared/components/pagina-no-encontrada/pagina-no-encontrada').then(
        (m) => m.PaginaNoEncontrada,
      ),
  },
];

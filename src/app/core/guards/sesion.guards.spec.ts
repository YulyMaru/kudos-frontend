import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { SesionService } from '../auth/sesion.service';
import { UsuarioActual } from '../../shared/models/sesion';
import { autenticadoGuard, invitadoGuard, rolGuard } from './sesion.guards';

describe('guards de sesión', () => {
  const autenticado = signal(false);
  const usuario = signal<UsuarioActual | null>(null);
  const ruta = {} as ActivatedRouteSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SesionService, useValue: { autenticado, usuario } }],
    });
  });

  function ejecutar(guard: CanActivateFn, url: string): boolean | UrlTree {
    return TestBed.runInInjectionContext(() => guard(ruta, { url } as RouterStateSnapshot)) as boolean | UrlTree;
  }

  it('autenticadoGuard deja pasar con sesión', () => {
    autenticado.set(true);

    expect(ejecutar(autenticadoGuard, '/feed')).toBe(true);
  });

  it('autenticadoGuard envía a iniciar sesión recordando a dónde volver', () => {
    autenticado.set(false);

    const resultado = ejecutar(autenticadoGuard, '/kudos/123');

    expect(TestBed.inject(Router).serializeUrl(resultado as UrlTree)).toBe('/iniciar-sesion?volver=%2Fkudos%2F123');
  });

  it('invitadoGuard redirige al feed si ya hay sesión', () => {
    autenticado.set(true);

    expect(TestBed.inject(Router).serializeUrl(ejecutar(invitadoGuard, '/iniciar-sesion') as UrlTree)).toBe('/feed');
  });

  it('invitadoGuard deja pasar sin sesión', () => {
    autenticado.set(false);

    expect(ejecutar(invitadoGuard, '/iniciar-sesion')).toBe(true);
  });

  it('rolGuard deja pasar a un rol permitido', () => {
    usuario.set({ id: '1', nombreCompleto: 'Rita Rectora', rol: 'RECTOR' });

    expect(ejecutar(rolGuard(['RECTOR', 'ADMINISTRADOR']), '/administracion/solicitudes')).toBe(true);
  });

  it('rolGuard envía al feed a un rol no permitido o sin usuario', () => {
    const router = TestBed.inject(Router);
    usuario.set({ id: '2', nombreCompleto: 'Ana Docente', rol: 'DOCENTE' });
    expect(router.serializeUrl(ejecutar(rolGuard(['RECTOR']), '/administracion/solicitudes') as UrlTree)).toBe('/feed');

    usuario.set(null);
    expect(router.serializeUrl(ejecutar(rolGuard(['RECTOR']), '/administracion/solicitudes') as UrlTree)).toBe('/feed');
  });
});

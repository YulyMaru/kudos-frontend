import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SesionRespuesta } from '../../shared/models/sesion';
import { CLAVE_TOKEN_REFRESCO, SesionService } from './sesion.service';

export function sesionDePrueba(sufijo = '1'): SesionRespuesta {
  return {
    tokenAcceso: `acceso-${sufijo}`,
    tipoToken: 'Bearer',
    expiraEn: '2026-11-11T10:15:00Z',
    tokenRefresco: `refresco-${sufijo}`,
    expiraRefrescoEn: '2026-11-18T10:00:00Z',
    usuarioId: 'usuario-1',
    nombreCompleto: 'Ana Docente',
    rol: 'DOCENTE',
  };
}

describe('SesionService', () => {
  const urlAuth = `${environment.apiUrl}/api/v1/auth`;
  let servicio: SesionService;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    servicio = TestBed.inject(SesionService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  it('al iniciar sesión guarda el token de acceso en memoria y el de refresco en localStorage', () => {
    let nombre = '';
    servicio.iniciarSesion('ana@uco.edu.co', 'Clave-Segura-2026').subscribe((usuario) => (nombre = usuario.nombreCompleto));

    const peticion = http.expectOne(`${urlAuth}/iniciar-sesion`);
    expect(peticion.request.body).toEqual({ correo: 'ana@uco.edu.co', contrasena: 'Clave-Segura-2026' });
    peticion.flush(sesionDePrueba());

    expect(nombre).toBe('Ana Docente');
    expect(servicio.autenticado()).toBe(true);
    expect(servicio.tokenAcceso()).toBe('acceso-1');
    expect(servicio.usuario()?.rol).toBe('DOCENTE');
    expect(localStorage.getItem(CLAVE_TOKEN_REFRESCO)).toBe('refresco-1');
  });

  it('comparte un único refresco entre peticiones simultáneas', () => {
    localStorage.setItem(CLAVE_TOKEN_REFRESCO, 'refresco-1');
    const tokens: string[] = [];

    servicio.refrescar().subscribe((token) => tokens.push(token));
    servicio.refrescar().subscribe((token) => tokens.push(token));
    const peticion = http.expectOne(`${urlAuth}/refrescar`);
    expect(peticion.request.body).toEqual({ tokenRefresco: 'refresco-1' });
    peticion.flush(sesionDePrueba('2'));

    expect(tokens).toEqual(['acceso-2', 'acceso-2']);
    expect(localStorage.getItem(CLAVE_TOKEN_REFRESCO)).toBe('refresco-2');
  });

  it('si el refresco falla limpia la sesión', () => {
    localStorage.setItem(CLAVE_TOKEN_REFRESCO, 'refresco-1');
    let fallo = false;

    servicio.refrescar().subscribe({ error: () => (fallo = true) });
    http.expectOne(`${urlAuth}/refrescar`).flush({ detail: 'x' }, { status: 401, statusText: 'Unauthorized' });

    expect(fallo).toBe(true);
    expect(servicio.autenticado()).toBe(false);
    expect(localStorage.getItem(CLAVE_TOKEN_REFRESCO)).toBeNull();
  });

  it('restaurar no hace peticiones si no hay token de refresco', async () => {
    await servicio.restaurar();

    http.expectNone(`${urlAuth}/refrescar`);
    expect(servicio.autenticado()).toBe(false);
  });

  it('restaurar recupera la sesión con el token de refresco guardado', async () => {
    localStorage.setItem(CLAVE_TOKEN_REFRESCO, 'refresco-1');

    const restauracion = servicio.restaurar();
    http.expectOne(`${urlAuth}/refrescar`).flush(sesionDePrueba('3'));
    await restauracion;

    expect(servicio.tokenAcceso()).toBe('acceso-3');
  });

  it('cerrar sesión revoca el token en el servidor, limpia y vuelve a iniciar sesión', () => {
    servicio.iniciarSesion('ana@uco.edu.co', 'x').subscribe();
    http.expectOne(`${urlAuth}/iniciar-sesion`).flush(sesionDePrueba());

    servicio.cerrarSesion();

    const peticion = http.expectOne(`${urlAuth}/cerrar-sesion`);
    expect(peticion.request.body).toEqual({ tokenRefresco: 'refresco-1' });
    peticion.flush(null, { status: 204, statusText: 'No Content' });
    expect(servicio.autenticado()).toBe(false);
    expect(localStorage.getItem(CLAVE_TOKEN_REFRESCO)).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/iniciar-sesion');
  });
});

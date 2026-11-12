import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SesionService } from '../auth/sesion.service';
import { autenticacionInterceptor } from './autenticacion.interceptor';

describe('autenticacionInterceptor', () => {
  const api = environment.apiUrl;
  const tokenAcceso = signal<string | null>('token-viejo');
  let refrescar: () => Observable<string>;
  const finalizarPorExpiracion = vi.fn();
  let http: HttpClient;
  let servidor: HttpTestingController;

  beforeEach(() => {
    tokenAcceso.set('token-viejo');
    refrescar = () => of('token-nuevo');
    finalizarPorExpiracion.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([autenticacionInterceptor])),
        provideHttpClientTesting(),
        {
          provide: SesionService,
          useValue: { tokenAcceso, refrescar: () => refrescar(), finalizarPorExpiracion },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    servidor = TestBed.inject(HttpTestingController);
  });

  afterEach(() => servidor.verify());

  it('agrega el token Bearer a las rutas protegidas de la API', () => {
    http.get(`${api}/api/v1/kudos`).subscribe();

    const peticion = servidor.expectOne(`${api}/api/v1/kudos`);
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-viejo');
    peticion.flush({ kudos: [], siguienteCursor: null });
  });

  it('no agrega el token a los endpoints públicos ni a otros dominios', () => {
    http.post(`${api}/api/v1/auth/iniciar-sesion`, {}).subscribe();
    http.post(`${api}/api/v1/registro/verificar`, {}).subscribe();
    http.get(`${api}/api/v1/catalogo/facultades`).subscribe();
    http.get('https://otro.dominio/api/v1/kudos').subscribe();

    for (const url of [
      `${api}/api/v1/auth/iniciar-sesion`,
      `${api}/api/v1/registro/verificar`,
      `${api}/api/v1/catalogo/facultades`,
      'https://otro.dominio/api/v1/kudos',
    ]) {
      const peticion = servidor.expectOne(url);
      expect(peticion.request.headers.has('Authorization')).toBe(false);
      peticion.flush({});
    }
  });

  it('ante un 401 refresca una sola vez y repite la petición con el token nuevo', () => {
    let respuesta: unknown;
    http.get(`${api}/api/v1/kudos`).subscribe((cuerpo) => (respuesta = cuerpo));

    servidor.expectOne(`${api}/api/v1/kudos`).flush({}, { status: 401, statusText: 'Unauthorized' });
    const reintento = servidor.expectOne(`${api}/api/v1/kudos`);
    expect(reintento.request.headers.get('Authorization')).toBe('Bearer token-nuevo');
    reintento.flush({ ok: true });

    expect(respuesta).toEqual({ ok: true });
    expect(finalizarPorExpiracion).not.toHaveBeenCalled();
  });

  it('si el refresco falla cierra la sesión y propaga el 401', () => {
    refrescar = () => throwError(() => new Error('refresco vencido'));
    let estado = 0;
    http.get(`${api}/api/v1/kudos`).subscribe({ error: (error: { status: number }) => (estado = error.status) });

    servidor.expectOne(`${api}/api/v1/kudos`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(estado).toBe(401);
    expect(finalizarPorExpiracion).toHaveBeenCalledTimes(1);
  });

  it('no intenta refrescar ante otros errores', () => {
    let estado = 0;
    http.get(`${api}/api/v1/kudos`).subscribe({ error: (error: { status: number }) => (estado = error.status) });

    servidor.expectOne(`${api}/api/v1/kudos`).flush({}, { status: 403, statusText: 'Forbidden' });

    expect(estado).toBe(403);
    expect(finalizarPorExpiracion).not.toHaveBeenCalled();
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { SolicitudesService } from './solicitudes.service';

describe('SolicitudesService', () => {
  const url = `${environment.apiUrl}/api/v1/solicitudes`;
  let servicio: SolicitudesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(SolicitudesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista las solicitudes pendientes', () => {
    const respuestas: unknown[] = [];
    servicio.listar().subscribe((solicitudes) => respuestas.push(solicitudes));

    const peticion = http.expectOne(url);
    expect(peticion.request.method).toBe('GET');
    peticion.flush([]);

    expect(respuestas).toEqual([[]]);
  });

  it('aprueba una solicitud sin cuerpo', () => {
    servicio.aprobar('s1').subscribe();

    const peticion = http.expectOne(`${url}/s1/aprobar`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toBeNull();
    peticion.flush(null);
  });

  it('rechaza una solicitud enviando el motivo', () => {
    servicio.rechazar('s1', 'Datos incompletos').subscribe();

    const peticion = http.expectOne(`${url}/s1/rechazar`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ motivo: 'Datos incompletos' });
    peticion.flush(null);
  });
});

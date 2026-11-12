import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { InteraccionesService, TAMANO_PAGINA_REPLICAS } from './interacciones.service';

describe('InteraccionesService', () => {
  const api = `${environment.apiUrl}/api/v1`;
  let servicio: InteraccionesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(InteraccionesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta las réplicas raíz y las respuestas con cursor', () => {
    servicio.replicas('k1', null, null).subscribe();
    servicio.replicas('k1', 'r1', 'c2').subscribe();

    const raiz = http.expectOne((p) => p.url === `${api}/kudos/k1/replicas` && !p.params.has('padre'));
    expect(raiz.request.params.get('limite')).toBe(String(TAMANO_PAGINA_REPLICAS));
    expect(raiz.request.params.has('cursor')).toBe(false);
    const hijas = http.expectOne((p) => p.params.get('padre') === 'r1');
    expect(hijas.request.params.get('cursor')).toBe('c2');
    raiz.flush({ replicas: [], siguienteCursor: null });
    hijas.flush({ replicas: [], siguienteCursor: null });
  });

  it('publica una réplica con su padre', () => {
    servicio.publicarReplica('k1', 'Gracias', 'r1').subscribe();

    const peticion = http.expectOne(`${api}/kudos/k1/replicas`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ contenido: 'Gracias', replicaPadreId: 'r1' });
  });

  it('califica y reporta contenido', () => {
    servicio.calificar('KUDO', 'k1', 5).subscribe();
    servicio.reportar('REPLICA', 'r1', 'Ofensivo').subscribe();

    const calificacion = http.expectOne(`${api}/calificaciones`);
    expect(calificacion.request.method).toBe('PUT');
    expect(calificacion.request.body).toEqual({ tipoContenido: 'KUDO', contenidoId: 'k1', valor: 5 });
    expect(http.expectOne(`${api}/reportes`).request.body).toEqual({
      tipoContenido: 'REPLICA',
      contenidoId: 'r1',
      motivo: 'Ofensivo',
    });
  });
});

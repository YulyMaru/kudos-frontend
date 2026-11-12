import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { KudoService } from './kudo.service';

describe('KudoService', () => {
  const api = `${environment.apiUrl}/api/v1`;
  const nuevo = { destinatarioId: 'd1', categoriaId: 'c1', contenido: 'Gracias' };
  let servicio: KudoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(KudoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('publica en JSON cuando no hay adjuntos', () => {
    servicio.publicar(nuevo, []).subscribe();

    const peticion = http.expectOne(`${api}/kudos`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(nuevo);
    peticion.flush({ id: 'k1', fechaPublicacion: '2026-11-11T10:00:00Z' });
  });

  it('publica en multipart con los campos y cada adjunto', () => {
    const archivo = new File(['%PDF-1.7'], 'evidencia.pdf', { type: 'application/pdf' });

    servicio.publicar(nuevo, [archivo]).subscribe();

    const peticion = http.expectOne(`${api}/kudos`);
    const cuerpo = peticion.request.body as FormData;
    expect(cuerpo.get('destinatarioId')).toBe('d1');
    expect(cuerpo.get('categoriaId')).toBe('c1');
    expect(cuerpo.get('contenido')).toBe('Gracias');
    expect((cuerpo.getAll('adjuntos')[0] as File).name).toBe('evidencia.pdf');
    peticion.flush({ id: 'k1', fechaPublicacion: '2026-11-11T10:00:00Z' });
  });

  it('busca destinatarios con el texto y un límite de sugerencias', () => {
    servicio.buscarUsuarios('die').subscribe();

    const peticion = http.expectOne((p) => p.url === `${api}/usuarios`);
    expect(peticion.request.params.get('busqueda')).toBe('die');
    expect(peticion.request.params.get('limite')).toBe('8');
    peticion.flush([]);
  });

  it('consulta las categorías activas', () => {
    servicio.categorias().subscribe();

    http.expectOne(`${api}/categorias`).flush([{ id: 'c1', nombre: 'Liderazgo' }]);
  });
});

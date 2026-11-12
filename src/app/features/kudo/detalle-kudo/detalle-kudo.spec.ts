import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { KudoDetalleVista } from '../../../shared/models/kudo';
import { DetalleKudo } from './detalle-kudo';

describe('DetalleKudo', () => {
  const urlKudo = `${environment.apiUrl}/api/v1/kudos/k1`;
  const detalle: KudoDetalleVista = {
    id: 'k1',
    autor: { id: 'a', nombreCompleto: 'Ana Docente', rol: 'DOCENTE' },
    destinatario: { id: 'd', nombreCompleto: 'Diego Estudiante', rol: 'ESTUDIANTE' },
    categoria: { id: 'c', nombre: 'Mentor Inspirador' },
    contenido: 'Texto completo\ncon varias líneas',
    fechaPublicacion: '2026-11-11T15:00:00Z',
    adjuntos: [{ id: 'adj1', nombreOriginal: 'evidencia.pdf', tipoContenido: 'application/pdf', tamanoBytes: 2048 }],
    cantidadReplicas: 3,
    promedioCalificacion: 4.5,
    cantidadCalificaciones: 2,
  };
  let fixture: ComponentFixture<DetalleKudo>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleKudo],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DetalleKudo);
    fixture.componentRef.setInput('id', 'k1');
  });

  afterEach(() => http.verify());

  function texto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('muestra el contenido completo, la categoría y los adjuntos', async () => {
    TestBed.tick();
    http.expectOne(urlKudo).flush(detalle);
    await fixture.whenStable();

    expect(texto()).toContain('Ana Docente reconoció a Diego Estudiante');
    expect(texto()).toContain('Mentor Inspirador');
    expect((fixture.nativeElement as HTMLElement).querySelector('.contenido')?.textContent).toBe(
      'Texto completo\ncon varias líneas',
    );
    expect(texto()).toContain('evidencia.pdf');
    expect(texto()).toContain('2.0 KB'.replace('.', ','));
    expect(texto()).toContain('3 réplicas');
  });

  it('pide el enlace temporal del adjunto al hacer clic y lo abre', async () => {
    const ventana = { opener: {}, location: { href: '' }, close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue(ventana as unknown as Window);
    TestBed.tick();
    http.expectOne(urlKudo).flush(detalle);
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.adjuntos button')?.click();
    http.expectOne(`${urlKudo}/adjuntos/adj1/enlace`).flush({ url: 'https://almacen/firmado', expiraEn: 'x' });

    expect(ventana.location.href).toBe('https://almacen/firmado');
    expect(ventana.opener).toBeNull();
  });

  it('informa cuando el Kudo no existe o fue vetado', async () => {
    TestBed.tick();
    http.expectOne(urlKudo).flush({ detail: 'No existe' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();

    expect(texto()).toContain('Este Kudo no está disponible');
  });

  it('muestra el error y permite reintentar', async () => {
    TestBed.tick();
    http.expectOne(urlKudo).flush({ detail: 'Servidor caído' }, { status: 500, statusText: 'x' });
    await fixture.whenStable();
    expect(texto()).toContain('Servidor caído');

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('app-estado-error button')?.click();
    TestBed.tick();
    http.expectOne(urlKudo).flush(detalle);
    await fixture.whenStable();

    expect(texto()).toContain('Mentor Inspirador');
  });
});

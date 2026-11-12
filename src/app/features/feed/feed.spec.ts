import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { NotificacionesService } from '../../notificaciones/notificaciones.service';
import { NotificacionKudoRecibido } from '../../shared/models/notificacion';
import { environment } from '../../../environments/environment';
import { KudoResumenVista, PaginaFeed } from '../../shared/models/kudo';
import { Feed } from './feed';

export function kudoDePrueba(id: string, extra: Partial<KudoResumenVista> = {}): KudoResumenVista {
  return {
    id,
    autor: { id: 'a', nombreCompleto: 'Ana Docente', rol: 'DOCENTE' },
    destinatario: { id: 'd', nombreCompleto: 'Diego Estudiante', rol: 'ESTUDIANTE' },
    categoria: { id: 'c', nombre: 'Liderazgo' },
    extracto: `Gracias ${id}`,
    contenidoTruncado: false,
    fechaPublicacion: new Date().toISOString(),
    cantidadAdjuntos: 0,
    cantidadReplicas: 0,
    promedioCalificacion: 0,
    cantidadCalificaciones: 0,
    ...extra,
  };
}

describe('Feed', () => {
  const urlFeed = `${environment.apiUrl}/api/v1/kudos`;
  const kudoRecibido$ = new Subject<NotificacionKudoRecibido>();
  let fixture: ComponentFixture<Feed>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Feed],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: NotificacionesService, useValue: { kudoRecibido$ } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Feed);
  });

  afterEach(() => http.verify());

  function responder(pagina: PaginaFeed, cursor: string | null = null): void {
    const peticion = http.expectOne((p) => p.url === urlFeed && p.params.get('cursor') === cursor);
    expect(peticion.request.params.get('limite')).toBe('10');
    peticion.flush(pagina);
  }

  function texto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('muestra esqueletos mientras carga y luego las tarjetas', async () => {
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-esqueleto-tarjeta')).not.toBeNull();

    responder({ kudos: [kudoDePrueba('1', { cantidadAdjuntos: 2, contenidoTruncado: true })], siguienteCursor: null });
    await fixture.whenStable();

    expect(texto()).toContain('Ana Docente');
    expect(texto()).toContain('Diego Estudiante');
    expect(texto()).toContain('Gracias 1…');
    expect(texto()).toContain('Ya viste todos los reconocimientos');
    expect((fixture.nativeElement as HTMLElement).querySelector('a')?.getAttribute('href')).toBe('/kudos/1');
  });

  it('carga la siguiente página con el cursor sin repetir los Kudos', async () => {
    await fixture.whenStable();
    responder({ kudos: [kudoDePrueba('1'), kudoDePrueba('2')], siguienteCursor: 'cursor-2' });
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.mas button')?.click();
    responder({ kudos: [kudoDePrueba('3')], siguienteCursor: null }, 'cursor-2');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('app-tarjeta-kudo').length).toBe(3);
    expect(texto()).toContain('Ya viste todos los reconocimientos');
  });

  it('muestra el estado vacío cuando no hay Kudos', async () => {
    await fixture.whenStable();
    responder({ kudos: [], siguienteCursor: null });
    await fixture.whenStable();

    expect(texto()).toContain('Aún no hay Kudos');
  });

  it('muestra el error y permite reintentar', async () => {
    await fixture.whenStable();
    http.expectOne((p) => p.url === urlFeed).flush({ detail: 'Servicio no disponible' }, { status: 503, statusText: 'x' });
    await fixture.whenStable();
    expect(texto()).toContain('Servicio no disponible');

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('app-estado-error button')?.click();
    responder({ kudos: [kudoDePrueba('1')], siguienteCursor: null });
    await fixture.whenStable();

    expect(texto()).toContain('Gracias 1');
  });

  it('se actualiza al recibir un Kudo en tiempo real', async () => {
    await fixture.whenStable();
    responder({ kudos: [kudoDePrueba('1')], siguienteCursor: null });
    await fixture.whenStable();

    kudoRecibido$.next({
      tipo: 'KUDO_RECIBIDO',
      idNotificacion: 'n1',
      idKudo: 'nuevo',
      nombreAutor: 'Ana Docente',
      nombreCategoria: 'Liderazgo',
    });
    responder({ kudos: [kudoDePrueba('nuevo'), kudoDePrueba('1')], siguienteCursor: null });
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('app-tarjeta-kudo').length).toBe(2);
    expect(texto()).toContain('Gracias nuevo');
  });
});

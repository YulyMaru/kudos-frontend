import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { App } from './app';
import { SesionService } from './core/auth/sesion.service';
import { NotificacionesService } from './notificaciones/notificaciones.service';
import { UsuarioActual } from './shared/models/sesion';

describe('App', () => {
  const estado = new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} });
  const autenticado = signal(true);
  const usuario = signal<UsuarioActual | null>({ id: '1', nombreCompleto: 'Ana Docente', rol: 'DOCENTE' });
  const cerrarSesion = vi.fn();

  beforeEach(async () => {
    autenticado.set(true);
    cerrarSesion.mockReset();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: BreakpointObserver, useValue: { observe: () => estado } },
        { provide: SesionService, useValue: { autenticado, usuario, cerrarSesion } },
        {
          provide: NotificacionesService,
          useValue: { estado: signal('CONECTADO'), noLeidas: signal(0), marcarLeidas: vi.fn() },
        },
      ],
    }).compileComponents();
  });

  async function crear(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra la navegación inferior y el botón de cerrar sesión en el celular', async () => {
    estado.next({ matches: false, breakpoints: {} });
    const elemento = await crear();

    expect(elemento.querySelector('nav.inferior')).not.toBeNull();
    expect(elemento.querySelector('mat-sidenav')).toBeNull();
    expect(elemento.querySelector('a.fab-kudo')?.getAttribute('href')).toBe('/kudos/nuevo');
    expect(elemento.querySelector('mat-toolbar app-estado-notificaciones')).not.toBeNull();
    elemento.querySelector<HTMLButtonElement>('button[aria-label="Cerrar sesión"]')?.click();
    expect(cerrarSesion).toHaveBeenCalled();
  });

  it('muestra la navegación lateral con el usuario y su rol en escritorio', async () => {
    estado.next({ matches: true, breakpoints: {} });
    const elemento = await crear();

    expect(elemento.querySelector('mat-sidenav')).not.toBeNull();
    expect(elemento.querySelector('.usuario')?.textContent).toContain('Ana Docente');
    expect(elemento.querySelector('a.dar-kudo')?.getAttribute('href')).toBe('/kudos/nuevo');
    expect(elemento.querySelector('a.fab-kudo')).toBeNull();
    expect(elemento.querySelector('.usuario')?.textContent).toContain('Docente');
  });

  it('oculta la navegación cuando no hay sesión', async () => {
    autenticado.set(false);
    const elemento = await crear();

    expect(elemento.querySelector('nav.inferior')).toBeNull();
    expect(elemento.querySelector('mat-sidenav')).toBeNull();
    expect(elemento.querySelector('main#contenido')).not.toBeNull();
  });

  it('ofrece un enlace para saltar al contenido', async () => {
    const elemento = await crear();

    expect(elemento.querySelector('a.saltar')?.getAttribute('href')).toBe('#contenido');
  });
});

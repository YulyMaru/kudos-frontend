import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { App } from './app';
import { SesionService } from './core/auth/sesion.service';
import { NotificacionesService } from './notificaciones/notificaciones.service';
import { DialogoConfirmacion } from './shared/components/dialogo-confirmacion/dialogo-confirmacion';
import { UsuarioActual } from './shared/models/sesion';

describe('App', () => {
  const estado = new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} });
  const autenticado = signal(true);
  const usuario = signal<UsuarioActual | null>({ id: '1', nombreCompleto: 'Ana Docente', rol: 'DOCENTE' });
  const cerrarSesion = vi.fn();
  const abrirDialogo = vi.fn();

  beforeEach(async () => {
    autenticado.set(true);
    usuario.set({ id: '1', nombreCompleto: 'Ana Docente', rol: 'DOCENTE' });
    cerrarSesion.mockReset();
    abrirDialogo.mockReset();
    abrirDialogo.mockReturnValue({ afterClosed: () => of(true) });
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: BreakpointObserver, useValue: { observe: () => estado } },
        { provide: SesionService, useValue: { autenticado, usuario, cerrarSesion } },
        { provide: MatDialog, useValue: { open: abrirDialogo } },
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
    expect(abrirDialogo).toHaveBeenCalledWith(
      DialogoConfirmacion,
      expect.objectContaining({
        role: 'alertdialog',
        data: { titulo: '¿Seguro que quieres cerrar sesión?', confirmar: 'Cerrar sesión' },
      }),
    );
    expect(cerrarSesion).toHaveBeenCalledWith();
  });

  it('no cierra la sesión si se cancela la confirmación', async () => {
    estado.next({ matches: true, breakpoints: {} });
    const elemento = await crear();

    for (const resultado of [false, undefined]) {
      abrirDialogo.mockReturnValue({ afterClosed: () => of(resultado) });
      elemento.querySelector<HTMLButtonElement>('button.salir')?.click();
    }

    expect(abrirDialogo).toHaveBeenCalledTimes(2);
    expect(cerrarSesion).not.toHaveBeenCalled();
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

  it('muestra el enlace a Solicitudes solo a los roles de administración', async () => {
    estado.next({ matches: false, breakpoints: {} });
    let elemento = await crear();
    expect(elemento.querySelector('nav.inferior a[href="/administracion/solicitudes"]')).toBeNull();

    usuario.set({ id: '2', nombreCompleto: 'Rita Rectora', rol: 'RECTOR' });
    elemento = await crear();
    expect(elemento.querySelector('nav.inferior a[href="/administracion/solicitudes"]')?.textContent).toContain('Solicitudes');

    estado.next({ matches: true, breakpoints: {} });
    elemento = await crear();
    expect(elemento.querySelector('mat-sidenav a[href="/administracion/solicitudes"]')).not.toBeNull();
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

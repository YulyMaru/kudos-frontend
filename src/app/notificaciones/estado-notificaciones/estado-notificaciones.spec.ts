import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { EstadoConexion } from '../../shared/models/notificacion';
import { NotificacionesService } from '../notificaciones.service';
import { EstadoNotificaciones } from './estado-notificaciones';

describe('EstadoNotificaciones', () => {
  const estado = signal<EstadoConexion>('CONECTADO');
  const noLeidas = signal(0);
  const marcarLeidas = vi.fn(() => noLeidas.set(0));
  let fixture: ComponentFixture<EstadoNotificaciones>;
  let router: Router;

  beforeEach(async () => {
    estado.set('CONECTADO');
    noLeidas.set(0);
    await TestBed.configureTestingModule({
      imports: [EstadoNotificaciones],
      providers: [provideRouter([]), { provide: NotificacionesService, useValue: { estado, noLeidas, marcarLeidas } }],
    }).compileComponents();
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(EstadoNotificaciones);
    await fixture.whenStable();
  });

  function elemento(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('indica el estado de la conexión en tiempo real', async () => {
    expect(elemento().querySelector('[role=status]')?.textContent).toContain('activas');
    expect(elemento().querySelector('.punto')?.classList).toContain('conectado');

    estado.set('DESCONECTADO');
    await fixture.whenStable();

    expect(elemento().querySelector('[role=status]')?.textContent).toContain('sin conexión');
    expect(elemento().querySelector('.punto')?.classList).not.toContain('conectado');
  });

  it('muestra cuántas notificaciones nuevas hay y las marca como leídas al abrirlas', async () => {
    noLeidas.set(2);
    await fixture.whenStable();
    const boton = elemento().querySelector<HTMLButtonElement>('button');

    expect(boton?.getAttribute('aria-label')).toBe('Notificaciones, 2 nuevas');
    boton?.click();

    expect(marcarLeidas).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/feed');
  });
});

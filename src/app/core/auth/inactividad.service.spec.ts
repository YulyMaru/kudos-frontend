import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { DialogoInactividad, ID_MENSAJE_INACTIVIDAD } from './dialogo-inactividad';
import { EVENTOS_ACTIVIDAD, InactividadService, MENSAJE_INACTIVIDAD } from './inactividad.service';
import { SesionService } from './sesion.service';

describe('InactividadService', () => {
  const QUINCE_MINUTOS = 15 * 60 * 1000;
  const autenticado = signal(false);
  const cerrarSesion = vi.fn(() => autenticado.set(false));
  let cierres: Subject<boolean | undefined>;
  const cerrar = vi.fn((resultado?: boolean) => cierres.next(resultado));
  const abrir = vi.fn(() => ({ afterClosed: () => cierres.asObservable(), close: cerrar }));

  beforeEach(() => {
    vi.useFakeTimers();
    autenticado.set(false);
    cerrarSesion.mockClear();
    cerrar.mockClear();
    abrir.mockClear();
    cierres = new Subject();
    TestBed.configureTestingModule({
      providers: [
        { provide: SesionService, useValue: { autenticado, cerrarSesion } },
        { provide: MatDialog, useValue: { open: abrir } },
      ],
    });
    TestBed.inject(InactividadService);
    TestBed.tick();
  });

  afterEach(() => {
    autenticado.set(false);
    TestBed.tick();
    vi.useRealTimers();
  });

  function iniciarSesion(): void {
    autenticado.set(true);
    TestBed.tick();
  }

  function segundos(): Signal<number> {
    const [, configuracion] = abrir.mock.calls[0] as unknown as [unknown, { data: Signal<number> }];
    return configuracion.data;
  }

  it('no vigila mientras no haya sesión iniciada', () => {
    vi.advanceTimersByTime(QUINCE_MINUTOS * 2);
    document.dispatchEvent(new Event('click'));

    expect(abrir).not.toHaveBeenCalled();
  });

  it('muestra el aviso accesible a los 15 minutos sin actividad', () => {
    iniciarSesion();

    vi.advanceTimersByTime(QUINCE_MINUTOS - 1);
    expect(abrir).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(abrir).toHaveBeenCalledWith(
      DialogoInactividad,
      expect.objectContaining({ role: 'alertdialog', ariaDescribedBy: ID_MENSAJE_INACTIVIDAD }),
    );
    expect(segundos()()).toBe(60);
  });

  it('cierra la sesión por inactividad cuando la cuenta regresiva llega a 0', () => {
    iniciarSesion();
    vi.advanceTimersByTime(QUINCE_MINUTOS);

    vi.advanceTimersByTime(59_000);
    expect(segundos()()).toBe(1);
    expect(cerrarSesion).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(segundos()()).toBe(0);
    expect(cerrar).toHaveBeenCalled();
    expect(cerrarSesion).toHaveBeenCalledWith(MENSAJE_INACTIVIDAD);

    TestBed.tick();
    vi.advanceTimersByTime(QUINCE_MINUTOS * 2);
    expect(cerrarSesion).toHaveBeenCalledTimes(1);
    expect(abrir).toHaveBeenCalledTimes(1);
  });

  it('reinicia la espera con cada clic, tecla, toque o scroll', () => {
    iniciarSesion();

    for (const evento of EVENTOS_ACTIVIDAD) {
      vi.advanceTimersByTime(QUINCE_MINUTOS - 1000);
      document.dispatchEvent(new Event(evento));
    }
    expect(abrir).not.toHaveBeenCalled();

    vi.advanceTimersByTime(QUINCE_MINUTOS);
    expect(abrir).toHaveBeenCalledTimes(1);
  });

  it('"Seguir conectado" detiene la cuenta regresiva y vuelve a esperar 15 minutos', () => {
    iniciarSesion();
    vi.advanceTimersByTime(QUINCE_MINUTOS);
    document.dispatchEvent(new Event('click'));
    vi.advanceTimersByTime(30_000);

    cierres.next(false);
    vi.advanceTimersByTime(60_000);
    expect(cerrarSesion).not.toHaveBeenCalled();
    expect(abrir).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(QUINCE_MINUTOS - 60_000);
    expect(abrir).toHaveBeenCalledTimes(2);
  });

  it('cerrar el aviso con Escape equivale a seguir conectado', () => {
    iniciarSesion();
    vi.advanceTimersByTime(QUINCE_MINUTOS);

    cierres.next(undefined);
    vi.advanceTimersByTime(60_000);

    expect(cerrarSesion).not.toHaveBeenCalled();
  });

  it('"Cerrar sesión" en el aviso usa el cierre de sesión normal', () => {
    iniciarSesion();
    vi.advanceTimersByTime(QUINCE_MINUTOS);

    cierres.next(true);

    expect(cerrarSesion).toHaveBeenCalledWith();
    TestBed.tick();
    vi.advanceTimersByTime(QUINCE_MINUTOS * 2);
    expect(cerrarSesion).toHaveBeenCalledTimes(1);
  });

  it('deja de vigilar y cierra el aviso si la sesión termina por otro medio', () => {
    iniciarSesion();
    vi.advanceTimersByTime(QUINCE_MINUTOS);

    autenticado.set(false);
    TestBed.tick();
    vi.advanceTimersByTime(60_000);
    document.dispatchEvent(new Event('keydown'));
    vi.advanceTimersByTime(QUINCE_MINUTOS * 2);

    expect(cerrar).toHaveBeenCalled();
    expect(cerrarSesion).not.toHaveBeenCalled();
    expect(abrir).toHaveBeenCalledTimes(1);
  });
});

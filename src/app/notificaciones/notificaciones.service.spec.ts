import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { RxStomp, RxStompConfig, RxStompState } from '@stomp/rx-stomp';
import { ReconnectionTimeMode } from '@stomp/stompjs';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { SesionService } from '../core/auth/sesion.service';
import { NotificacionKudoRecibido } from '../shared/models/notificacion';
import {
  DESTINO_NOTIFICACIONES,
  esNotificacionKudo,
  FABRICA_CLIENTE_STOMP,
  NotificacionesService,
} from './notificaciones.service';

class ClienteStompFalso {
  configuracion: RxStompConfig | null = null;
  activado = false;
  desactivado = false;
  destino = '';
  readonly connectionState$ = new BehaviorSubject<RxStompState>(RxStompState.CLOSED);
  readonly mensajes = new Subject<{ body: string }>();

  configure(configuracion: RxStompConfig): void {
    this.configuracion = configuracion;
  }

  activate(): void {
    this.activado = true;
    this.connectionState$.next(RxStompState.CONNECTING);
  }

  deactivate(): Promise<void> {
    this.desactivado = true;
    return Promise.resolve();
  }

  watch(destino: string): Subject<{ body: string }> {
    this.destino = destino;
    return this.mensajes;
  }
}

describe('NotificacionesService', () => {
  const tokenAcceso = signal<string | null>(null);
  const accion = new Subject<void>();
  const abrirAviso = vi.fn(() => ({ onAction: () => accion }));
  let clientes: ClienteStompFalso[];
  let servicio: NotificacionesService;
  let router: Router;

  const notificacion: NotificacionKudoRecibido = {
    tipo: 'KUDO_RECIBIDO',
    idNotificacion: 'n1',
    idKudo: 'k1',
    nombreAutor: 'Ana Docente',
    nombreCategoria: 'Liderazgo',
  };

  beforeEach(() => {
    tokenAcceso.set(null);
    clientes = [];
    abrirAviso.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SesionService, useValue: { tokenAcceso } },
        { provide: MatSnackBar, useValue: { open: abrirAviso } },
        {
          provide: FABRICA_CLIENTE_STOMP,
          useValue: () => {
            const cliente = new ClienteStompFalso();
            clientes.push(cliente);
            return cliente as unknown as RxStomp;
          },
        },
      ],
    });
    servicio = TestBed.inject(NotificacionesService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    TestBed.tick();
  });

  function iniciarSesion(token: string): ClienteStompFalso {
    tokenAcceso.set(token);
    TestBed.tick();
    return clientes[clientes.length - 1];
  }

  it('no se conecta sin sesión', () => {
    expect(clientes).toEqual([]);
    expect(servicio.estado()).toBe('DESCONECTADO');
  });

  it('al iniciar sesión se conecta al WebSocket con el JWT y la reconexión exponencial', () => {
    const cliente = iniciarSesion('token-1');

    expect(cliente.configuracion?.brokerURL).toBe(environment.wsUrl);
    expect(cliente.configuracion?.connectHeaders).toEqual({ Authorization: 'Bearer token-1' });
    expect(cliente.configuracion?.reconnectTimeMode).toBe(ReconnectionTimeMode.EXPONENTIAL);
    expect(cliente.destino).toBe(DESTINO_NOTIFICACIONES);
    expect(cliente.activado).toBe(true);
    expect(servicio.estado()).toBe('CONECTANDO');

    cliente.connectionState$.next(RxStompState.OPEN);
    expect(servicio.estado()).toBe('CONECTADO');
  });

  it('al recibir un Kudo muestra el aviso, suma al contador y emite el evento', () => {
    const cliente = iniciarSesion('token-1');
    const recibidos: NotificacionKudoRecibido[] = [];
    servicio.kudoRecibido$.subscribe((n) => recibidos.push(n));

    cliente.mensajes.next({ body: JSON.stringify(notificacion) });

    expect(servicio.noLeidas()).toBe(1);
    expect(recibidos).toEqual([notificacion]);
    expect(abrirAviso).toHaveBeenCalledWith('¡Ana Docente te dio un Kudo en Liderazgo!', 'Ver', {
      duration: 8000,
      politeness: 'assertive',
    });
  });

  it('la acción Ver navega al detalle del Kudo y limpia el contador', () => {
    const cliente = iniciarSesion('token-1');
    cliente.mensajes.next({ body: JSON.stringify(notificacion) });

    accion.next();

    expect(router.navigate).toHaveBeenCalledWith(['/kudos', 'k1']);
    expect(servicio.noLeidas()).toBe(0);
  });

  it('ignora mensajes mal formados o de otro tipo', () => {
    const cliente = iniciarSesion('token-1');

    cliente.mensajes.next({ body: 'no es json' });
    cliente.mensajes.next({ body: JSON.stringify({ tipo: 'OTRO', idKudo: 'k1' }) });

    expect(servicio.noLeidas()).toBe(0);
    expect(abrirAviso).not.toHaveBeenCalled();
  });

  it('al refrescar el token se reconecta con el nuevo', () => {
    const primero = iniciarSesion('token-1');

    const segundo = iniciarSesion('token-2');

    expect(primero.desactivado).toBe(true);
    expect(segundo.configuracion?.connectHeaders).toEqual({ Authorization: 'Bearer token-2' });
    expect(clientes.length).toBe(2);
  });

  it('al cerrar sesión se desconecta', () => {
    const cliente = iniciarSesion('token-1');

    tokenAcceso.set(null);
    TestBed.tick();

    expect(cliente.desactivado).toBe(true);
    expect(servicio.estado()).toBe('DESCONECTADO');
  });

  it('valida la forma de la notificación', () => {
    expect(esNotificacionKudo(notificacion)).toBe(true);
    expect(esNotificacionKudo({ tipo: 'KUDO_RECIBIDO', idKudo: '' })).toBe(false);
    expect(esNotificacionKudo(null)).toBe(false);
  });
});

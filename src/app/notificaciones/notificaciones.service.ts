import { effect, inject, Injectable, InjectionToken, signal, untracked } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { RxStomp, RxStompState } from '@stomp/rx-stomp';
import { ReconnectionTimeMode } from '@stomp/stompjs';
import { Subject, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { SesionService } from '../core/auth/sesion.service';
import { EstadoConexion, NotificacionKudoRecibido } from '../shared/models/notificacion';

export const DESTINO_NOTIFICACIONES = '/user/queue/notificaciones';
export const ESPERA_INICIAL_RECONEXION_MS = 1_000;
export const ESPERA_MAXIMA_RECONEXION_MS = 30_000;

export const FABRICA_CLIENTE_STOMP = new InjectionToken<() => RxStomp>('FABRICA_CLIENTE_STOMP', {
  providedIn: 'root',
  factory: () => () => new RxStomp(),
});

export function esNotificacionKudo(valor: unknown): valor is NotificacionKudoRecibido {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }
  const mensaje = valor as Record<string, unknown>;
  return mensaje['tipo'] === 'KUDO_RECIBIDO' && typeof mensaje['idKudo'] === 'string' && mensaje['idKudo'] !== '';
}

function estadoDesde(estado: RxStompState): EstadoConexion {
  if (estado === RxStompState.OPEN) {
    return 'CONECTADO';
  }
  return estado === RxStompState.CONNECTING ? 'CONECTANDO' : 'DESCONECTADO';
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly sesion = inject(SesionService);
  private readonly avisos = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly crearCliente = inject(FABRICA_CLIENTE_STOMP);
  private readonly kudoRecibidoInterno = new Subject<NotificacionKudoRecibido>();
  private cliente: RxStomp | null = null;
  private suscripciones = new Subscription();

  readonly estado = signal<EstadoConexion>('DESCONECTADO');
  readonly noLeidas = signal(0);
  readonly kudoRecibido$ = this.kudoRecibidoInterno.asObservable();

  constructor() {
    effect(() => {
      const token = this.sesion.tokenAcceso();
      untracked(() => {
        if (token === null) {
          this.desconectar();
        } else {
          this.conectar(token);
        }
      });
    });
  }

  marcarLeidas(): void {
    this.noLeidas.set(0);
  }

  private conectar(token: string): void {
    this.desconectar();
    const cliente = this.crearCliente();
    cliente.configure({
      brokerURL: environment.wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: ESPERA_INICIAL_RECONEXION_MS,
      maxReconnectDelay: ESPERA_MAXIMA_RECONEXION_MS,
      reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
    });
    this.suscripciones = new Subscription();
    this.suscripciones.add(cliente.connectionState$.subscribe((estado) => this.estado.set(estadoDesde(estado))));
    this.suscripciones.add(
      cliente.watch(DESTINO_NOTIFICACIONES).subscribe((mensaje) => this.procesar(mensaje.body)),
    );
    this.cliente = cliente;
    cliente.activate();
  }

  private desconectar(): void {
    this.suscripciones.unsubscribe();
    const cliente = this.cliente;
    this.cliente = null;
    this.estado.set('DESCONECTADO');
    if (cliente !== null) {
      void cliente.deactivate();
    }
  }

  private procesar(cuerpo: string): void {
    let contenido: unknown;
    try {
      contenido = JSON.parse(cuerpo);
    } catch {
      return;
    }
    if (!esNotificacionKudo(contenido)) {
      return;
    }
    const notificacion = contenido;
    this.noLeidas.update((cantidad) => cantidad + 1);
    this.kudoRecibidoInterno.next(notificacion);
    this.avisos
      .open(`¡${notificacion.nombreAutor} te dio un Kudo en ${notificacion.nombreCategoria}!`, 'Ver', {
        duration: 8000,
        politeness: 'assertive',
      })
      .onAction()
      .subscribe(() => {
        this.marcarLeidas();
        void this.router.navigate(['/kudos', notificacion.idKudo]);
      });
  }
}

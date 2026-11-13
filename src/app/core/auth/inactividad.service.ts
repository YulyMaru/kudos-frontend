import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, Signal, signal, untracked } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { CONFIGURACION_DIALOGO } from '../../shared/components/dialogo-confirmacion/dialogo-confirmacion';
import { DialogoInactividad, ID_MENSAJE_INACTIVIDAD } from './dialogo-inactividad';
import { SesionService } from './sesion.service';

export const EVENTOS_ACTIVIDAD: readonly string[] = ['click', 'keydown', 'touchstart', 'scroll'];
export const MENSAJE_INACTIVIDAD = 'Tu sesión se cerró por inactividad';
const OPCIONES_ESCUCHA: AddEventListenerOptions = { capture: true, passive: true };
const INTERVALO_CUENTA_MS = 1000;

@Injectable({ providedIn: 'root' })
export class InactividadService {
  private readonly sesion = inject(SesionService);
  private readonly dialogos = inject(MatDialog);
  private readonly documento = inject(DOCUMENT);
  private readonly segundos = signal(0);
  private espera: ReturnType<typeof setTimeout> | undefined;
  private cuenta: ReturnType<typeof setInterval> | undefined;
  private limite = 0;
  private dialogo: MatDialogRef<DialogoInactividad, boolean> | null = null;
  private readonly alActuar = (): void => {
    if (this.dialogo === null) {
      this.programarAviso();
    }
  };

  constructor() {
    effect(() => {
      const autenticado = this.sesion.autenticado();
      untracked(() => (autenticado ? this.vigilar() : this.detener()));
    });
  }

  private vigilar(): void {
    for (const evento of EVENTOS_ACTIVIDAD) {
      this.documento.addEventListener(evento, this.alActuar, OPCIONES_ESCUCHA);
    }
    this.programarAviso();
  }

  private detener(): void {
    for (const evento of EVENTOS_ACTIVIDAD) {
      this.documento.removeEventListener(evento, this.alActuar, OPCIONES_ESCUCHA);
    }
    clearTimeout(this.espera);
    this.cerrarDialogo();
  }

  private programarAviso(): void {
    clearTimeout(this.espera);
    this.espera = setTimeout(() => this.avisar(), environment.inactividad.esperaAvisoMs);
  }

  private avisar(): void {
    const duracion = environment.inactividad.cuentaRegresivaSegundos;
    this.limite = Date.now() + duracion * 1000;
    this.segundos.set(duracion);
    const dialogo = this.dialogos.open<DialogoInactividad, Signal<number>, boolean>(DialogoInactividad, {
      ...CONFIGURACION_DIALOGO,
      ariaDescribedBy: ID_MENSAJE_INACTIVIDAD,
      data: this.segundos.asReadonly(),
    });
    this.dialogo = dialogo;
    this.cuenta = setInterval(() => this.descontar(), INTERVALO_CUENTA_MS);
    dialogo.afterClosed().subscribe((cerrar) => this.alCerrarDialogo(dialogo, cerrar === true));
  }

  private descontar(): void {
    const restantes = Math.max(0, Math.ceil((this.limite - Date.now()) / 1000));
    this.segundos.set(restantes);
    if (restantes === 0) {
      this.cerrarDialogo();
      this.sesion.cerrarSesion(MENSAJE_INACTIVIDAD);
    }
  }

  private alCerrarDialogo(dialogo: MatDialogRef<DialogoInactividad, boolean>, cerrar: boolean): void {
    if (this.dialogo !== dialogo) {
      return;
    }
    this.dialogo = null;
    clearInterval(this.cuenta);
    if (cerrar) {
      this.sesion.cerrarSesion();
    } else {
      this.programarAviso();
    }
  }

  private cerrarDialogo(): void {
    clearInterval(this.cuenta);
    const dialogo = this.dialogo;
    this.dialogo = null;
    dialogo?.close();
  }
}

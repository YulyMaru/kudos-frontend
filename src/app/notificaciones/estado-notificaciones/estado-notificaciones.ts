import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { EstadoConexion } from '../../shared/models/notificacion';
import { NotificacionesService } from '../notificaciones.service';

const DESCRIPCIONES: Record<EstadoConexion, string> = {
  CONECTADO: 'Notificaciones en tiempo real activas',
  CONECTANDO: 'Conectando las notificaciones en tiempo real',
  DESCONECTADO: 'Notificaciones en tiempo real sin conexión',
};

@Component({
  selector: 'app-estado-notificaciones',
  imports: [MatBadgeModule, MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      mat-icon-button
      type="button"
      (click)="verNotificaciones()"
      [matBadge]="notificaciones.noLeidas()"
      [matBadgeHidden]="notificaciones.noLeidas() === 0"
      matBadgeColor="warn"
      [matTooltip]="descripcion()"
      [attr.aria-label]="etiqueta()"
    >
      <mat-icon aria-hidden="true">notifications</mat-icon>
    </button>
    <span
      class="punto"
      [class.conectado]="notificaciones.estado() === 'CONECTADO'"
      [class.conectando]="notificaciones.estado() === 'CONECTANDO'"
      aria-hidden="true"
    ></span>
    <span class="visualmente-oculto" role="status">{{ descripcion() }}</span>
  `,
  styles: `
    :host {
      position: relative;
      display: inline-flex;
      align-items: center;
    }
    .punto {
      position: absolute;
      right: 8px;
      bottom: 8px;
      width: 10px;
      height: 10px;
      border: 2px solid var(--mat-sys-surface);
      border-radius: 50%;
      background: var(--mat-sys-outline);
    }
    .conectado {
      background: #1e8e3e;
    }
    .conectando {
      background: #f9ab00;
    }
  `,
})
export class EstadoNotificaciones {
  private readonly router = inject(Router);
  protected readonly notificaciones = inject(NotificacionesService);

  protected readonly descripcion = computed(() => DESCRIPCIONES[this.notificaciones.estado()]);
  protected readonly etiqueta = computed(() => {
    const cantidad = this.notificaciones.noLeidas();
    return cantidad === 0 ? 'Notificaciones, sin nuevas' : `Notificaciones, ${cantidad} nuevas`;
  });

  protected verNotificaciones(): void {
    this.notificaciones.marcarLeidas();
    void this.router.navigateByUrl('/feed');
  }
}

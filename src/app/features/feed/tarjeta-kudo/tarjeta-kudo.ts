import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { KudoResumenVista } from '../../../shared/models/kudo';
import { FechaRelativaPipe } from '../../../shared/pipes/fecha-relativa.pipe';

@Component({
  selector: 'app-tarjeta-kudo',
  imports: [RouterLink, MatIconModule, FechaRelativaPipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let item = kudo();
    <a class="tarjeta" [routerLink]="['/kudos', item.id]">
      <header>
        <span class="categoria">{{ item.categoria.nombre }}</span>
        <time [attr.datetime]="item.fechaPublicacion">{{ item.fechaPublicacion | fechaRelativa }}</time>
      </header>
      <p class="personas">
        <strong>{{ item.autor.nombreCompleto }}</strong> reconoció a <strong>{{ item.destinatario.nombreCompleto }}</strong>
      </p>
      <p class="extracto">{{ item.extracto }}@if (item.contenidoTruncado) {…}</p>
      <footer>
        @if (item.cantidadCalificaciones > 0) {
          <span class="dato" [attr.aria-label]="'Calificación promedio ' + (item.promedioCalificacion | number: '1.1-1')">
            <mat-icon aria-hidden="true">star</mat-icon>{{ item.promedioCalificacion | number: '1.1-1' }}
          </span>
        }
        <span class="dato" [attr.aria-label]="item.cantidadReplicas + ' réplicas'">
          <mat-icon aria-hidden="true">forum</mat-icon>{{ item.cantidadReplicas }}
        </span>
        @if (item.cantidadAdjuntos > 0) {
          <span class="dato" [attr.aria-label]="item.cantidadAdjuntos + ' adjuntos'">
            <mat-icon aria-hidden="true">attach_file</mat-icon>{{ item.cantidadAdjuntos }}
          </span>
        }
      </footer>
    </a>
  `,
  styles: `
    .tarjeta {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container-low);
      border: 1px solid var(--mat-sys-outline-variant);
      color: inherit;
      text-decoration: none;
    }
    .tarjeta:hover {
      background: var(--mat-sys-surface-container);
    }
    header,
    footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    footer {
      justify-content: flex-start;
      gap: 16px;
    }
    .categoria {
      padding: 4px 10px;
      border-radius: 16px;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
      font: var(--mat-sys-label-large);
    }
    time,
    .dato {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .dato {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .dato mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
    }
    p {
      margin: 0;
    }
    .extracto {
      color: var(--mat-sys-on-surface-variant);
      overflow-wrap: anywhere;
    }
  `,
})
export class TarjetaKudo {
  readonly kudo = input.required<KudoResumenVista>();
}

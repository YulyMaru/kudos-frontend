import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { mensajeDeError } from '../../../core/http/mensaje-error';
import { ResumenCalificacion, TipoContenido } from '../../../shared/models/interaccion';
import { InteraccionesService } from '../interacciones.service';

export const VALORES_CALIFICACION: readonly number[] = [1, 2, 3, 4, 5];

@Component({
  selector: 'app-calificacion',
  imports: [DecimalPipe, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="estrellas" role="group" [attr.aria-label]="'Calificar ' + etiquetaContenido()">
      @for (valor of valores; track valor) {
        <button
          mat-icon-button
          type="button"
          [disabled]="guardando()"
          (click)="calificar(valor)"
          [attr.aria-label]="'Calificar con ' + valor + (valor === 1 ? ' estrella' : ' estrellas')"
          [attr.aria-pressed]="miCalificacion() === valor"
        >
          <mat-icon aria-hidden="true" [class.llena]="valor <= (miCalificacion() ?? 0)">star</mat-icon>
        </button>
      }
    </div>
    <span class="resumen" aria-live="polite">
      @if (cantidadActual() > 0) {
        {{ promedioActual() | number: '1.1-1' }} · {{ cantidadActual() }}
        {{ cantidadActual() === 1 ? 'calificación' : 'calificaciones' }}
      } @else {
        Sin calificaciones
      }
      @if (miCalificacion(); as valor) {
        · Tu calificación: {{ valor }}
      }
    </span>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 8px;
    }
    .estrellas {
      display: flex;
    }
    mat-icon {
      color: var(--mat-sys-outline);
    }
    mat-icon.llena {
      color: #b06d00;
      font-variation-settings: 'FILL' 1;
    }
    .resumen {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class Calificacion {
  private readonly interacciones = inject(InteraccionesService);
  private readonly avisos = inject(MatSnackBar);

  readonly tipo = input.required<TipoContenido>();
  readonly contenidoId = input.required<string>();
  readonly promedio = input.required<number>();
  readonly cantidad = input.required<number>();

  protected readonly valores = VALORES_CALIFICACION;
  protected readonly guardando = signal(false);
  private readonly resumen = signal<ResumenCalificacion | null>(null);
  protected readonly promedioActual = computed(() => this.resumen()?.promedio ?? this.promedio());
  protected readonly cantidadActual = computed(() => this.resumen()?.cantidad ?? this.cantidad());
  protected readonly miCalificacion = computed(() => this.resumen()?.miCalificacion ?? null);
  protected readonly etiquetaContenido = computed(() => (this.tipo() === 'KUDO' ? 'este Kudo' : 'esta réplica'));

  protected calificar(valor: number): void {
    this.guardando.set(true);
    this.interacciones.calificar(this.tipo(), this.contenidoId(), valor).subscribe({
      next: (resumen) => {
        this.guardando.set(false);
        this.resumen.set(resumen);
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        this.avisos.open(mensajeDeError(error), 'Cerrar', { duration: 6000 });
      },
    });
  }
}

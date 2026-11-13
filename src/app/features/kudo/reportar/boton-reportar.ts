import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { filter, switchMap } from 'rxjs';
import { mensajeDeError } from '../../../core/http/mensaje-error';
import { TipoContenido } from '../../../shared/models/interaccion';
import { AvisosService } from '../../../shared/services/avisos.service';
import { InteraccionesService } from '../interacciones.service';
import { DialogoReportar } from './dialogo-reportar';

@Component({
  selector: 'app-boton-reportar',
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button mat-button type="button" class="reportar" (click)="abrir()" [disabled]="reportado()">
      <mat-icon aria-hidden="true">flag</mat-icon>
      {{ reportado() ? 'Reportado' : 'Reportar' }}
    </button>
  `,
  styles: `
    .reportar {
      min-height: 48px;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class BotonReportar {
  private readonly dialogos = inject(MatDialog);
  private readonly interacciones = inject(InteraccionesService);
  private readonly avisos = inject(AvisosService);

  readonly tipo = input.required<TipoContenido>();
  readonly contenidoId = input.required<string>();

  protected readonly reportado = signal(false);

  protected abrir(): void {
    this.dialogos
      .open<DialogoReportar, TipoContenido, string>(DialogoReportar, {
        data: this.tipo(),
        width: '480px',
        maxWidth: 'calc(100vw - 32px)',
        autoFocus: 'first-tabbable',
      })
      .afterClosed()
      .pipe(
        filter((motivo): motivo is string => typeof motivo === 'string' && motivo !== ''),
        switchMap((motivo) => this.interacciones.reportar(this.tipo(), this.contenidoId(), motivo)),
      )
      .subscribe({
        next: () => {
          this.reportado.set(true);
          this.avisos.mostrar('Gracias. Tu reporte quedó registrado para revisión');
        },
        error: (error: unknown) => this.avisos.error(mensajeDeError(error)),
      });
  }
}

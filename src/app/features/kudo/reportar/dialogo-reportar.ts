import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TipoContenido } from '../../../shared/models/interaccion';

export const LONGITUD_MAXIMA_MOTIVO = 500;

@Component({
  selector: 'app-dialogo-reportar',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Reportar {{ tipo === 'KUDO' ? 'Kudo' : 'réplica' }}</h2>
    <form [formGroup]="formulario" (ngSubmit)="enviar()" novalidate>
      <mat-dialog-content>
        <p>El Rector y el Coordinador Académico revisarán tu reporte.</p>
        <mat-form-field appearance="outline">
          <mat-label>Motivo del reporte</mat-label>
          <textarea matInput formControlName="motivo" rows="4" [maxlength]="longitudMaxima"></textarea>
          <mat-hint align="end">{{ formulario.controls.motivo.value.length }} / {{ longitudMaxima }}</mat-hint>
          @if (formulario.controls.motivo.invalid) {
            <mat-error>Describe por qué el contenido es inapropiado</mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit">Enviar reporte</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    mat-form-field {
      width: 100%;
    }
    button {
      min-height: 48px;
    }
  `,
})
export class DialogoReportar {
  private readonly dialogo = inject<MatDialogRef<DialogoReportar, string>>(MatDialogRef);

  protected readonly tipo = inject<TipoContenido>(MAT_DIALOG_DATA);
  protected readonly longitudMaxima = LONGITUD_MAXIMA_MOTIVO;
  protected readonly formulario = inject(NonNullableFormBuilder).group({
    motivo: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(LONGITUD_MAXIMA_MOTIVO)]],
  });

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.dialogo.close(this.formulario.getRawValue().motivo.trim());
  }
}

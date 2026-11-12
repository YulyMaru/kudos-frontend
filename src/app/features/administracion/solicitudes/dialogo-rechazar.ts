import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-dialogo-rechazar',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Rechazar solicitud</h2>
    <form [formGroup]="formulario" (ngSubmit)="enviar()" novalidate>
      <mat-dialog-content>
        <p>Indica por qué rechazas la solicitud de {{ nombre }}.</p>
        <mat-form-field appearance="outline">
          <mat-label>Motivo del rechazo</mat-label>
          <textarea matInput formControlName="motivo" rows="4"></textarea>
          @if (formulario.controls.motivo.invalid) {
            <mat-error>Escribe el motivo del rechazo</mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit">Rechazar</button>
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
export class DialogoRechazar {
  private readonly dialogo = inject<MatDialogRef<DialogoRechazar, string>>(MatDialogRef);

  protected readonly nombre = inject<string>(MAT_DIALOG_DATA);
  protected readonly formulario = inject(NonNullableFormBuilder).group({
    motivo: ['', [Validators.required, Validators.pattern(/\S/)]],
  });

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.dialogo.close(this.formulario.getRawValue().motivo.trim());
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';

export interface DatosConfirmacion {
  readonly titulo: string;
  readonly confirmar: string;
}

export const CONFIGURACION_DIALOGO: MatDialogConfig = {
  role: 'alertdialog',
  width: '400px',
  maxWidth: 'calc(100vw - 32px)',
  autoFocus: 'first-tabbable',
  restoreFocus: true,
};

@Component({
  selector: 'app-dialogo-confirmacion',
  imports: [MatButtonModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ datos.titulo }}</h2>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Cancelar</button>
      <button mat-flat-button type="button" [mat-dialog-close]="true">{{ datos.confirmar }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    button {
      min-height: 48px;
    }
  `,
})
export class DialogoConfirmacion {
  protected readonly datos = inject<DatosConfirmacion>(MAT_DIALOG_DATA);
}

export function confirmar(dialogos: MatDialog, datos: DatosConfirmacion): Observable<boolean> {
  return dialogos
    .open<DialogoConfirmacion, DatosConfirmacion, boolean>(DialogoConfirmacion, { ...CONFIGURACION_DIALOGO, data: datos })
    .afterClosed()
    .pipe(map((resultado) => resultado === true));
}

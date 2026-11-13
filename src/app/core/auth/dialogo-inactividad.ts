import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export const ID_MENSAJE_INACTIVIDAD = 'mensaje-inactividad';

@Component({
  selector: 'app-dialogo-inactividad',
  imports: [MatButtonModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Tu sesión está por expirar</h2>
    <mat-dialog-content>
      <p [id]="idMensaje">
        Por inactividad, tu sesión se cerrará en
        <strong>{{ segundos() }}</strong>
        segundos.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="true">Cerrar sesión</button>
      <button mat-flat-button type="button" [mat-dialog-close]="false" cdkFocusInitial>Seguir conectado</button>
    </mat-dialog-actions>
  `,
  styles: `
    p {
      margin: 0;
    }
    strong {
      font-variant-numeric: tabular-nums;
    }
    button {
      min-height: 48px;
    }
  `,
})
export class DialogoInactividad {
  protected readonly idMensaje = ID_MENSAJE_INACTIVIDAD;
  protected readonly segundos = inject<Signal<number>>(MAT_DIALOG_DATA);
}

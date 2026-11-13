import { inject, Injectable } from '@angular/core';
import { AriaLivePoliteness } from '@angular/cdk/a11y';
import { MatSnackBar } from '@angular/material/snack-bar';

export const DURACION_AVISO_MS = 4000;
export const ACCION_CERRAR_AVISO = 'Cerrar';

@Injectable({ providedIn: 'root' })
export class AvisosService {
  private readonly snackBar = inject(MatSnackBar);

  mostrar(mensaje: string): void {
    this.abrir(mensaje, 'aviso-confirmacion', 'polite');
  }

  error(mensaje: string): void {
    this.abrir(mensaje, 'aviso-error', 'assertive');
  }

  private abrir(mensaje: string, estilo: string, politeness: AriaLivePoliteness): void {
    this.snackBar.open(mensaje, ACCION_CERRAR_AVISO, {
      duration: DURACION_AVISO_MS,
      panelClass: ['aviso', estilo],
      politeness,
    });
  }
}

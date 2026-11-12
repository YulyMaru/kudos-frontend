import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/http/mensaje-error';
import { EsqueletoTarjeta } from '../../../shared/components/esqueleto-tarjeta/esqueleto-tarjeta';
import { EstadoError } from '../../../shared/components/estado-error/estado-error';
import { EstadoVacio } from '../../../shared/components/estado-vacio/estado-vacio';
import { AdjuntoVista } from '../../../shared/models/kudo';
import { RolLegiblePipe } from '../../../shared/pipes/rol-legible.pipe';
import { TamanoArchivoPipe } from '../../../shared/pipes/tamano-archivo.pipe';
import { KudoService } from '../kudo.service';

@Component({
  selector: 'app-detalle-kudo',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    DatePipe,
    DecimalPipe,
    EsqueletoTarjeta,
    EstadoError,
    EstadoVacio,
    RolLegiblePipe,
    TamanoArchivoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detalle-kudo.html',
  styleUrl: './detalle-kudo.scss',
})
export class DetalleKudo {
  private readonly kudos = inject(KudoService);

  readonly id = input.required<string>();

  protected readonly kudo = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.kudos.detalle(params),
  });
  protected readonly abriendo = signal<string | null>(null);
  protected readonly errorAdjunto = signal<string | null>(null);

  protected noExiste(): boolean {
    const error = this.kudo.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  }

  protected mensajeError(): string {
    return mensajeDeError(this.kudo.error());
  }

  protected icono(adjunto: AdjuntoVista): string {
    return adjunto.tipoContenido === 'application/pdf' ? 'picture_as_pdf' : 'image';
  }

  protected abrirAdjunto(adjunto: AdjuntoVista): void {
    const ventana = window.open('', '_blank');
    this.abriendo.set(adjunto.id);
    this.errorAdjunto.set(null);
    this.kudos.enlaceAdjunto(this.id(), adjunto.id).subscribe({
      next: (enlace) => {
        this.abriendo.set(null);
        if (ventana === null) {
          window.location.assign(enlace.url);
          return;
        }
        ventana.opener = null;
        ventana.location.href = enlace.url;
      },
      error: (error: unknown) => {
        this.abriendo.set(null);
        ventana?.close();
        this.errorAdjunto.set(mensajeDeError(error));
      },
    });
  }
}

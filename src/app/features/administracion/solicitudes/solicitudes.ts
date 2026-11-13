import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { filter, Observable } from 'rxjs';
import { mensajeDeError } from '../../../core/http/mensaje-error';
import { EsqueletoTarjeta } from '../../../shared/components/esqueleto-tarjeta/esqueleto-tarjeta';
import { EstadoError } from '../../../shared/components/estado-error/estado-error';
import { EstadoVacio } from '../../../shared/components/estado-vacio/estado-vacio';
import { SolicitudPendiente } from '../../../shared/models/solicitud';
import { FechaRelativaPipe } from '../../../shared/pipes/fecha-relativa.pipe';
import { RolLegiblePipe } from '../../../shared/pipes/rol-legible.pipe';
import { AvisosService } from '../../../shared/services/avisos.service';
import { DialogoRechazar } from './dialogo-rechazar';
import { SolicitudesService } from './solicitudes.service';

@Component({
  selector: 'app-solicitudes',
  imports: [MatButtonModule, MatIconModule, EsqueletoTarjeta, EstadoError, EstadoVacio, RolLegiblePipe, FechaRelativaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './solicitudes.html',
  styleUrl: './solicitudes.scss',
})
export class Solicitudes {
  private readonly solicitudesApi = inject(SolicitudesService);
  private readonly dialogos = inject(MatDialog);
  private readonly avisos = inject(AvisosService);

  protected readonly solicitudes = signal<readonly SolicitudPendiente[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly procesando = signal<string | null>(null);

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.solicitudesApi.listar().subscribe({
      next: (solicitudes) => {
        this.cargando.set(false);
        this.solicitudes.set(solicitudes);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(error));
      },
    });
  }

  protected aprobar(solicitud: SolicitudPendiente): void {
    this.resolver(solicitud, this.solicitudesApi.aprobar(solicitud.id), 'Solicitud aprobada');
  }

  protected rechazar(solicitud: SolicitudPendiente): void {
    this.dialogos
      .open<DialogoRechazar, string, string>(DialogoRechazar, {
        data: solicitud.nombreCompleto,
        width: '480px',
        maxWidth: 'calc(100vw - 32px)',
        autoFocus: 'first-tabbable',
      })
      .afterClosed()
      .pipe(filter((motivo): motivo is string => typeof motivo === 'string' && motivo !== ''))
      .subscribe((motivo) =>
        this.resolver(solicitud, this.solicitudesApi.rechazar(solicitud.id, motivo), 'Solicitud rechazada'),
      );
  }

  private resolver(solicitud: SolicitudPendiente, peticion: Observable<void>, confirmacion: string): void {
    this.procesando.set(solicitud.id);
    peticion.subscribe({
      next: () => {
        this.procesando.set(null);
        this.solicitudes.update((actuales) => actuales.filter((s) => s.id !== solicitud.id));
        this.avisos.mostrar(confirmacion);
      },
      error: (error: unknown) => {
        this.procesando.set(null);
        this.avisos.error(mensajeDeError(error));
      },
    });
  }
}

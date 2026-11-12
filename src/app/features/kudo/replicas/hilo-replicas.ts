import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { mensajeDeError } from '../../../core/http/mensaje-error';
import { ReplicaVista } from '../../../shared/models/interaccion';
import { RolLegiblePipe } from '../../../shared/pipes/rol-legible.pipe';
import { FechaRelativaPipe } from '../../../shared/pipes/fecha-relativa.pipe';
import { Calificacion } from '../calificacion/calificacion';
import { InteraccionesService } from '../interacciones.service';
import { BotonReportar } from '../reportar/boton-reportar';
import { FormularioReplica } from './formulario-replica';

@Component({
  selector: 'app-hilo-replicas',
  imports: [MatButtonModule, MatIconModule, RolLegiblePipe, FechaRelativaPipe, Calificacion, BotonReportar, FormularioReplica],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hilo-replicas.html',
  styleUrl: './hilo-replicas.scss',
})
export class HiloReplicas {
  private readonly interacciones = inject(InteraccionesService);
  private carga = new Subscription();

  readonly kudoId = input.required<string>();
  readonly padreId = input<string | null>(null);
  readonly version = input(0);
  readonly publicada = output<void>();

  protected readonly replicas = signal<readonly ReplicaVista[]>([]);
  protected readonly siguienteCursor = signal<string | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly respondiendo = signal<string | null>(null);
  protected readonly abiertas = signal<ReadonlySet<string>>(new Set());
  protected readonly versiones = signal<Readonly<Record<string, number>>>({});

  constructor() {
    effect(() => {
      this.kudoId();
      this.padreId();
      this.version();
      untracked(() => this.cargar(null));
    });
  }

  protected cargarMas(): void {
    const cursor = this.siguienteCursor();
    if (cursor !== null && !this.cargando()) {
      this.cargar(cursor);
    }
  }

  protected reintentar(): void {
    this.cargar(null);
  }

  protected alternarRespuesta(replica: ReplicaVista): void {
    this.respondiendo.update((actual) => (actual === replica.id ? null : replica.id));
  }

  protected alternarRespuestas(replica: ReplicaVista): void {
    this.abiertas.update((actuales) => {
      const nuevas = new Set(actuales);
      if (!nuevas.delete(replica.id)) {
        nuevas.add(replica.id);
      }
      return nuevas;
    });
  }

  protected alPublicarRaiz(): void {
    this.cargar(null);
    this.publicada.emit();
  }

  protected alResponder(replica: ReplicaVista): void {
    this.respondiendo.set(null);
    this.replicas.update((actuales) =>
      actuales.map((r) => (r.id === replica.id ? { ...r, cantidadRespuestas: r.cantidadRespuestas + 1 } : r)),
    );
    this.abiertas.update((actuales) => new Set(actuales).add(replica.id));
    this.versiones.update((actuales) => ({ ...actuales, [replica.id]: (actuales[replica.id] ?? 0) + 1 }));
    this.publicada.emit();
  }

  private cargar(cursor: string | null): void {
    this.carga.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);
    this.carga = this.interacciones.replicas(this.kudoId(), this.padreId(), cursor).subscribe({
      next: (pagina) => {
        this.cargando.set(false);
        this.replicas.update((actuales) => (cursor === null ? pagina.replicas : [...actuales, ...pagina.replicas]));
        this.siguienteCursor.set(pagina.siguienteCursor);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(error));
      },
    });
  }
}

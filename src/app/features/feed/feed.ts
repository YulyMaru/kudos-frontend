import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { mensajeDeError } from '../../core/http/mensaje-error';
import { EsqueletoTarjeta } from '../../shared/components/esqueleto-tarjeta/esqueleto-tarjeta';
import { EstadoError } from '../../shared/components/estado-error/estado-error';
import { EstadoVacio } from '../../shared/components/estado-vacio/estado-vacio';
import { NotificacionesService } from '../../notificaciones/notificaciones.service';
import { KudoResumenVista } from '../../shared/models/kudo';
import { FeedService } from './feed.service';
import { TarjetaKudo } from './tarjeta-kudo/tarjeta-kudo';

@Component({
  selector: 'app-feed',
  imports: [EstadoVacio, EstadoError, EsqueletoTarjeta, TarjetaKudo, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feed.html',
  styleUrl: './feed.scss',
})
export class Feed {
  private readonly feed = inject(FeedService);
  private readonly centinela = viewChild<ElementRef<HTMLElement>>('centinela');

  protected readonly kudos = signal<readonly KudoResumenVista[]>([]);
  protected readonly siguienteCursor = signal<string | null>(null);
  protected readonly cargandoInicial = signal(true);
  protected readonly cargandoMas = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.recargar();
    inject(NotificacionesService)
      .kudoRecibido$.pipe(takeUntilDestroyed())
      .subscribe(() => this.recargar());
    effect((alLimpiar) => {
      const elemento = this.centinela()?.nativeElement;
      if (elemento === undefined || typeof IntersectionObserver === 'undefined') {
        return;
      }
      const observador = new IntersectionObserver(
        (entradas) => {
          if (entradas.some((entrada) => entrada.isIntersecting)) {
            this.cargarMas();
          }
        },
        { rootMargin: '300px' },
      );
      observador.observe(elemento);
      alLimpiar(() => observador.disconnect());
    });
  }

  recargar(): void {
    this.cargandoInicial.set(true);
    this.error.set(null);
    this.feed.pagina(null).subscribe({
      next: (pagina) => {
        this.kudos.set(pagina.kudos);
        this.siguienteCursor.set(pagina.siguienteCursor);
        this.cargandoInicial.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.cargandoInicial.set(false);
      },
    });
  }

  protected cargarMas(): void {
    const cursor = this.siguienteCursor();
    if (cursor === null || this.cargandoMas() || this.cargandoInicial()) {
      return;
    }
    this.cargandoMas.set(true);
    this.feed.pagina(cursor).subscribe({
      next: (pagina) => {
        this.kudos.update((actuales) => [...actuales, ...pagina.kudos]);
        this.siguienteCursor.set(pagina.siguienteCursor);
        this.cargandoMas.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.cargandoMas.set(false);
      },
    });
  }
}

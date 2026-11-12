import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-esqueleto-tarjeta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lista" aria-busy="true" aria-label="Cargando">
      @for (indice of indices(); track indice) {
        <div class="tarjeta" aria-hidden="true">
          <span class="linea corta"></span>
          <span class="linea"></span>
          <span class="linea"></span>
          <span class="linea media"></span>
        </div>
      }
    </div>
  `,
  styles: `
    .lista {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .tarjeta {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container);
    }
    .linea {
      height: 12px;
      border-radius: 6px;
      background: var(--mat-sys-surface-container-highest);
      animation: pulso 1.2s ease-in-out infinite;
    }
    .corta {
      width: 40%;
    }
    .media {
      width: 70%;
    }
    @keyframes pulso {
      50% {
        opacity: 0.5;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .linea {
        animation: none;
      }
    }
  `,
})
export class EsqueletoTarjeta {
  readonly cantidad = input(3);

  protected indices(): number[] {
    return Array.from({ length: this.cantidad() }, (_, indice) => indice);
  }
}

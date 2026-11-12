import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-estado-vacio',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="estado" role="status">
      <mat-icon aria-hidden="true">{{ icono() }}</mat-icon>
      <h2>{{ titulo() }}</h2>
      <p>{{ mensaje() }}</p>
      <ng-content />
    </section>
  `,
  styles: `
    .estado {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 48px 16px;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }
    mat-icon {
      width: 48px;
      height: 48px;
      font-size: 48px;
    }
    h2 {
      margin: 0;
      font: var(--mat-sys-title-large);
      color: var(--mat-sys-on-surface);
    }
    p {
      margin: 0;
      font: var(--mat-sys-body-medium);
    }
  `,
})
export class EstadoVacio {
  readonly icono = input('inbox');
  readonly titulo = input.required<string>();
  readonly mensaje = input('');
}

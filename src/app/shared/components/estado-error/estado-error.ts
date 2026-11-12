import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-estado-error',
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="estado" role="alert">
      <mat-icon aria-hidden="true">error</mat-icon>
      <p>{{ mensaje() }}</p>
      <button mat-stroked-button type="button" (click)="reintentar.emit()">Reintentar</button>
    </section>
  `,
  styles: `
    .estado {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 32px 16px;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }
    mat-icon {
      width: 40px;
      height: 40px;
      font-size: 40px;
      color: var(--mat-sys-error);
    }
    p {
      margin: 0;
    }
    button {
      min-height: 48px;
    }
  `,
})
export class EstadoError {
  readonly mensaje = input.required<string>();
  readonly reintentar = output();
}

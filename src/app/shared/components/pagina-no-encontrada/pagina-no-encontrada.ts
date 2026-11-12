import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pagina-no-encontrada',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="estado" aria-labelledby="titulo-no-encontrada">
      <mat-icon class="estado__icono" aria-hidden="true">explore_off</mat-icon>
      <h1 id="titulo-no-encontrada">No encontramos esta página</h1>
      <p>Es posible que el enlace esté incompleto o que la página ya no exista.</p>
      <a mat-flat-button routerLink="/feed">Volver al inicio</a>
    </section>
  `,
  styles: `
    .estado {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px 16px;
      text-align: center;
    }
    .estado__icono {
      width: 56px;
      height: 56px;
      font-size: 56px;
      color: var(--mat-sys-primary);
    }
    h1 {
      margin: 0;
      font: var(--mat-sys-headline-small);
    }
    p {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class PaginaNoEncontrada {}

import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { SesionService } from './core/auth/sesion.service';
import { EstadoNotificaciones } from './notificaciones/estado-notificaciones/estado-notificaciones';
import { RolLegiblePipe } from './shared/pipes/rol-legible.pipe';

export interface EnlaceNavegacion {
  readonly ruta: string;
  readonly etiqueta: string;
  readonly icono: string;
}

export const CONSULTA_ESCRITORIO = '(min-width: 960px)';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    RolLegiblePipe,
    EstadoNotificaciones,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly breakpoints = inject(BreakpointObserver);
  protected readonly sesion = inject(SesionService);

  protected readonly esEscritorio = toSignal(
    this.breakpoints.observe(CONSULTA_ESCRITORIO).pipe(map((estado) => estado.matches)),
    { initialValue: false },
  );

  protected readonly enlaces: readonly EnlaceNavegacion[] = [{ ruta: '/feed', etiqueta: 'Inicio', icono: 'home' }];

  protected cerrarSesion(): void {
    this.sesion.cerrarSesion();
  }
}

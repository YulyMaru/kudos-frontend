import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { SesionService } from '../../../core/auth/sesion.service';
import { mensajeDeError } from '../../../core/http/mensaje-error';

export function destinoSeguro(volver: string | undefined): string {
  return volver !== undefined && volver.startsWith('/') && !volver.startsWith('//') ? volver : '/feed';
}

@Component({
  selector: 'app-iniciar-sesion',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './iniciar-sesion.html',
  styleUrl: '../acceso.scss',
})
export class IniciarSesion {
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  readonly volver = input<string>();

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', Validators.required],
  });
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mostrarContrasena = signal(false);

  protected alternarContrasena(): void {
    this.mostrarContrasena.update((visible) => !visible);
  }

  protected enviar(): void {
    if (this.formulario.invalid || this.enviando()) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { correo, contrasena } = this.formulario.getRawValue();
    this.enviando.set(true);
    this.error.set(null);
    this.sesion.iniciarSesion(correo.trim(), contrasena).subscribe({
      next: () => {
        this.enviando.set(false);
        void this.router.navigateByUrl(destinoSeguro(this.volver()));
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.error.set(mensajeDeError(error));
      },
    });
  }
}

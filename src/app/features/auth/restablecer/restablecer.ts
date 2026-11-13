import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { mensajeDeError } from '../../../core/http/mensaje-error';
import { MensajeRespuesta } from '../../../shared/models/registro';
import { AvisosService } from '../../../shared/services/avisos.service';
import { CuentaService } from '../cuenta.service';
import { contrasenasIguales, LONGITUD_MINIMA_CONTRASENA, VALIDADORES_CONTRASENA } from '../validadores';

@Component({
  selector: 'app-restablecer',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './restablecer.html',
  styleUrl: '../acceso.scss',
})
export class Restablecer {
  private readonly cuentas = inject(CuentaService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly avisos = inject(AvisosService);

  readonly token = input<string>();

  protected readonly longitudMinima = LONGITUD_MINIMA_CONTRASENA;
  protected readonly solicitud = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
  });
  protected readonly confirmacion = this.fb.group(
    {
      contrasena: ['', VALIDADORES_CONTRASENA],
      confirmacion: ['', Validators.required],
    },
    { validators: contrasenasIguales },
  );
  protected readonly enviando = signal(false);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly terminado = signal(false);

  protected solicitar(): void {
    if (this.solicitud.invalid || this.enviando()) {
      this.solicitud.markAllAsTouched();
      return;
    }
    this.ejecutar(this.cuentas.solicitarRestablecimiento(this.solicitud.getRawValue().correo.trim().toLowerCase()));
  }

  protected confirmar(): void {
    const token = this.token();
    if (token === undefined || this.confirmacion.invalid || this.enviando()) {
      this.confirmacion.markAllAsTouched();
      return;
    }
    this.ejecutar(this.cuentas.confirmarRestablecimiento(token, this.confirmacion.getRawValue().contrasena), 'Contraseña restablecida');
  }

  private ejecutar(operacion: Observable<MensajeRespuesta>, confirmacion?: string): void {
    this.enviando.set(true);
    this.error.set(null);
    this.mensaje.set(null);
    operacion.subscribe({
      next: (respuesta) => {
        this.enviando.set(false);
        this.terminado.set(true);
        this.mensaje.set(respuesta.mensaje);
        if (confirmacion !== undefined) {
          this.avisos.mostrar(confirmacion);
        }
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.error.set(mensajeDeError(error));
      },
    });
  }
}

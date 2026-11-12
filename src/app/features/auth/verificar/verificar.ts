import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/http/mensaje-error';
import { CanalVerificacion } from '../../../shared/models/registro';
import { CuentaService } from '../cuenta.service';
import { PATRON_CODIGO } from '../validadores';

interface EstadoCanal {
  readonly verificado: boolean;
  readonly ocupado: boolean;
  readonly mensaje: string | null;
  readonly error: string | null;
}

interface DescripcionCanal {
  readonly canal: CanalVerificacion;
  readonly titulo: string;
  readonly icono: string;
  readonly ayuda: string;
}

const ESTADO_INICIAL: EstadoCanal = { verificado: false, ocupado: false, mensaje: null, error: null };

export const CANALES: readonly DescripcionCanal[] = [
  { canal: 'CORREO', titulo: 'Correo institucional', icono: 'mail', ayuda: 'Código de 6 dígitos enviado a tu correo' },
  { canal: 'CELULAR', titulo: 'Celular', icono: 'smartphone', ayuda: 'Código de 6 dígitos enviado por WhatsApp' },
];

@Component({
  selector: 'app-verificar',
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './verificar.html',
  styleUrl: '../acceso.scss',
})
export class Verificar implements OnInit {
  private readonly cuentas = inject(CuentaService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly correo = input<string>();

  protected readonly canales = CANALES;
  protected readonly campoCorreo = this.fb.control('', [Validators.required, Validators.email]);
  protected readonly codigos: Record<CanalVerificacion, FormControl<string>> = {
    CORREO: this.fb.control('', [Validators.required, Validators.pattern(PATRON_CODIGO)]),
    CELULAR: this.fb.control('', [Validators.required, Validators.pattern(PATRON_CODIGO)]),
  };
  protected readonly estados = signal<Record<CanalVerificacion, EstadoCanal>>({
    CORREO: ESTADO_INICIAL,
    CELULAR: ESTADO_INICIAL,
  });
  protected readonly completo = computed(() => this.estados().CORREO.verificado && this.estados().CELULAR.verificado);

  ngOnInit(): void {
    const correo = this.correo();
    if (correo !== undefined) {
      this.campoCorreo.setValue(correo);
    }
  }

  protected verificar(canal: CanalVerificacion): void {
    const control = this.codigos[canal];
    if (!this.correoValido() || control.invalid || this.estados()[canal].ocupado) {
      control.markAsTouched();
      return;
    }
    this.actualizar(canal, { ocupado: true, mensaje: null, error: null });
    this.cuentas.verificar(this.correoNormalizado(), canal, control.value.trim()).subscribe({
      next: (respuesta) => this.actualizar(canal, { ocupado: false, verificado: true, mensaje: respuesta.mensaje }),
      error: (error: unknown) => this.actualizar(canal, { ocupado: false, error: mensajeDeError(error) }),
    });
  }

  protected reenviar(canal: CanalVerificacion): void {
    if (!this.correoValido() || this.estados()[canal].ocupado) {
      return;
    }
    this.actualizar(canal, { ocupado: true, mensaje: null, error: null });
    this.cuentas.reenviarCodigo(this.correoNormalizado(), canal).subscribe({
      next: (respuesta) => {
        this.codigos[canal].reset();
        this.actualizar(canal, { ocupado: false, mensaje: respuesta.mensaje });
      },
      error: (error: unknown) => this.actualizar(canal, { ocupado: false, error: mensajeDeError(error) }),
    });
  }

  private correoValido(): boolean {
    this.campoCorreo.markAsTouched();
    return this.campoCorreo.valid;
  }

  private correoNormalizado(): string {
    return this.campoCorreo.value.trim().toLowerCase();
  }

  private actualizar(canal: CanalVerificacion, cambios: Partial<EstadoCanal>): void {
    this.estados.update((actuales) => ({ ...actuales, [canal]: { ...actuales[canal], ...cambios } }));
  }
}

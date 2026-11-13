import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/http/mensaje-error';
import { CampoCelular } from '../../../shared/components/campo-celular/campo-celular';
import { Rol } from '../../../shared/models/sesion';
import { RolLegiblePipe } from '../../../shared/pipes/rol-legible.pipe';
import { AvisosService } from '../../../shared/services/avisos.service';
import { CuentaService } from '../cuenta.service';
import { contrasenasIguales, LONGITUD_MINIMA_CONTRASENA, VALIDADORES_CONTRASENA } from '../validadores';

export const ROLES_REGISTRO: readonly Rol[] = [
  'ESTUDIANTE',
  'DOCENTE',
  'COORDINADOR_PROGRAMA',
  'COORDINADOR_FACULTAD',
  'COORDINADOR_ACADEMICO',
  'RECTOR',
];

export function requierePrograma(rol: Rol | null): boolean {
  return rol === 'ESTUDIANTE' || rol === 'DOCENTE' || rol === 'COORDINADOR_PROGRAMA';
}

export function requiereFacultad(rol: Rol | null): boolean {
  return rol === 'COORDINADOR_FACULTAD';
}

@Component({
  selector: 'app-registro',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    RolLegiblePipe,
    CampoCelular,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registro.html',
  styleUrl: '../acceso.scss',
})
export class Registro {
  private readonly cuentas = inject(CuentaService);
  private readonly router = inject(Router);
  private readonly avisos = inject(AvisosService);

  protected readonly roles = ROLES_REGISTRO;
  protected readonly longitudMinima = LONGITUD_MINIMA_CONTRASENA;
  protected readonly requierePrograma = requierePrograma;
  protected readonly requiereFacultad = requiereFacultad;
  protected readonly formulario = inject(NonNullableFormBuilder).group(
    {
      nombreCompleto: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
      correo: ['', [Validators.required, Validators.email]],
      celular: [''],
      rol: new FormControl<Rol | null>(null, Validators.required),
      facultadId: [''],
      programaId: [''],
      contrasena: ['', VALIDADORES_CONTRASENA],
      confirmacion: ['', Validators.required],
      aceptaPolitica: [false, Validators.requiredTrue],
    },
    { validators: contrasenasIguales },
  );
  protected readonly rol = toSignal(this.formulario.controls.rol.valueChanges, { initialValue: null });
  protected readonly facultadSeleccionada = toSignal(this.formulario.controls.facultadId.valueChanges, {
    initialValue: '',
  });
  protected readonly facultades = rxResource({ stream: () => this.cuentas.facultades() });
  protected readonly programas = rxResource({
    params: () => {
      const facultad = this.facultadSeleccionada();
      return requierePrograma(this.rol()) && facultad !== '' ? facultad : undefined;
    },
    stream: ({ params }) => this.cuentas.programas(params),
  });
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    const { rol, facultadId, programaId } = this.formulario.controls;
    rol.valueChanges.pipe(takeUntilDestroyed()).subscribe((valor) => {
      facultadId.setValidators(requierePrograma(valor) || requiereFacultad(valor) ? Validators.required : null);
      programaId.setValidators(requierePrograma(valor) ? Validators.required : null);
      facultadId.updateValueAndValidity({ emitEvent: false });
      programaId.updateValueAndValidity();
    });
    facultadId.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => programaId.setValue(''));
  }

  protected registrar(): void {
    if (this.formulario.invalid || this.enviando()) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    const rol = valores.rol;
    if (rol === null) {
      return;
    }
    const correo = valores.correo.trim().toLowerCase();
    this.enviando.set(true);
    this.error.set(null);
    this.cuentas
      .registrar({
        nombreCompleto: valores.nombreCompleto.trim(),
        correo,
        celular: valores.celular,
        rol,
        facultadId: requiereFacultad(rol) ? valores.facultadId : null,
        programaId: requierePrograma(rol) ? valores.programaId : null,
        contrasena: valores.contrasena,
        aceptaPolitica: valores.aceptaPolitica,
      })
      .subscribe({
        next: (respuesta) => {
          this.enviando.set(false);
          this.avisos.mostrar(respuesta.mensaje);
          void this.router.navigate(['/verificar'], { queryParams: { correo } });
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          this.error.set(mensajeDeError(error));
        },
      });
  }
}

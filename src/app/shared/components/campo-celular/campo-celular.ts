import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, ControlValueAccessor, NgControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ISO_POR_DEFECTO, Pais, paisPorIso, PAISES } from './paises';

export interface CelularSeparado {
  readonly pais: Pais;
  readonly numero: string;
}

export function combinarCelular(pais: Pais, numero: string): string {
  return numero === '' ? '' : `+${pais.indicativo}${numero}`;
}

export function separarCelular(valor: string, actual: Pais): CelularSeparado {
  const digitos = valor.replace(/\D/g, '');
  const candidatos = valor.trim().startsWith('+') ? PAISES.filter((opcion) => digitos.startsWith(opcion.indicativo)) : [];
  if (candidatos.length === 0) {
    return { pais: actual, numero: digitos };
  }
  const pais = candidatos.includes(actual)
    ? actual
    : candidatos.reduce((elegido, opcion) => (opcion.indicativo.length > elegido.indicativo.length ? opcion : elegido));
  return { pais, numero: digitos.slice(pais.indicativo.length) };
}

export function validarCelular(valor: string, actual: Pais): ValidationErrors | null {
  const { pais, numero } = separarCelular(valor, actual);
  if (numero === '') {
    return { required: true };
  }
  return numero.length < pais.minimo || numero.length > pais.maximo
    ? { celularLongitud: { minimo: pais.minimo, maximo: pais.maximo } }
    : null;
}

export function describirLongitud(pais: Pais): string {
  return pais.minimo === pais.maximo ? `${pais.minimo} dígitos` : `entre ${pais.minimo} y ${pais.maximo} dígitos`;
}

@Component({
  selector: 'app-campo-celular',
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="campo-celular" role="group" [attr.aria-label]="etiqueta()">
      <mat-form-field appearance="outline" class="indicativo">
        <mat-label>País</mat-label>
        <mat-select [value]="pais().iso" [panelWidth]="null" (selectionChange)="elegirPais($event.value)">
          <mat-select-trigger>
            <span aria-hidden="true">{{ pais().bandera }}</span> +{{ pais().indicativo }}
          </mat-select-trigger>
          @for (opcion of paises; track opcion.iso) {
            <mat-option [value]="opcion.iso">
              <span aria-hidden="true">{{ opcion.bandera }}</span> {{ opcion.nombre }} (+{{ opcion.indicativo }})
            </mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="numero">
        <mat-label>{{ etiqueta() }}</mat-label>
        <input
          matInput
          type="tel"
          inputmode="numeric"
          autocomplete="tel-national"
          [value]="numero()"
          [errorStateMatcher]="estadoError"
          (input)="escribir($event)"
          (blur)="tocar()"
        />
        <mat-hint>Solo números, {{ longitud() }}</mat-hint>
        <mat-error>{{ mensajeError() }}</mat-error>
      </mat-form-field>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .campo-celular {
      display: flex;
      gap: 8px;
    }
    .indicativo {
      flex: 0 0 120px;
    }
    .numero {
      flex: 1;
      min-width: 0;
    }
  `,
})
export class CampoCelular implements ControlValueAccessor, OnInit {
  private readonly ngControl = inject(NgControl, { self: true });
  private readonly cambios = inject(ChangeDetectorRef);
  private readonly destruccion = inject(DestroyRef);
  private readonly entrada = viewChild(MatInput);

  readonly etiqueta = input('Celular');

  protected readonly paises = PAISES;
  protected readonly pais = signal(paisPorIso(ISO_POR_DEFECTO));
  protected readonly numero = signal('');
  protected readonly longitud = computed(() => describirLongitud(this.pais()));
  protected readonly estadoError: ErrorStateMatcher = { isErrorState: () => this.conError() };

  private alCambiar: (valor: string) => void = () => undefined;
  private alTocar: () => void = () => undefined;
  private readonly validador: ValidatorFn = (control: AbstractControl<string | null>) =>
    validarCelular(control.value ?? '', this.pais());

  constructor() {
    this.ngControl.valueAccessor = this;
  }

  ngOnInit(): void {
    const control = this.ngControl.control;
    if (control === null) {
      return;
    }
    control.addValidators(this.validador);
    control.updateValueAndValidity();
    control.events.pipe(takeUntilDestroyed(this.destruccion)).subscribe(() => {
      this.entrada()?.updateErrorState();
      this.cambios.markForCheck();
    });
    this.destruccion.onDestroy(() => control.removeValidators(this.validador));
  }

  writeValue(valor: string | null): void {
    const separado = separarCelular(valor ?? '', this.pais());
    this.pais.set(separado.pais);
    this.numero.set(separado.numero);
    this.cambios.markForCheck();
  }

  registerOnChange(funcion: (valor: string) => void): void {
    this.alCambiar = funcion;
  }

  registerOnTouched(funcion: () => void): void {
    this.alTocar = funcion;
  }

  protected elegirPais(iso: string): void {
    this.pais.set(paisPorIso(iso));
    this.emitir();
  }

  protected escribir(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const digitos = entrada.value.replace(/\D/g, '').slice(0, this.pais().maximo);
    entrada.value = digitos;
    this.numero.set(digitos);
    this.emitir();
  }

  protected tocar(): void {
    this.alTocar();
  }

  protected mensajeError(): string {
    return this.ngControl.control?.hasError('required')
      ? 'Escribe tu número celular'
      : `El número debe tener ${this.longitud()}`;
  }

  private conError(): boolean {
    const control = this.ngControl.control;
    return control !== null && control.invalid && control.touched;
  }

  private emitir(): void {
    this.alCambiar(combinarCelular(this.pais(), this.numero()));
  }
}

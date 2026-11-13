import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export const LONGITUD_MINIMA_CONTRASENA = 12;
export const BYTES_MAXIMOS_CONTRASENA = 72;
export const PATRON_CODIGO = /^\d{6}$/;

export function contrasenaSegura(control: AbstractControl<string>): ValidationErrors | null {
  const valor = control.value;
  if (valor === '') {
    return null;
  }
  if (valor.length < LONGITUD_MINIMA_CONTRASENA || valor.trim() === '') {
    return { contrasenaCorta: true };
  }
  return new TextEncoder().encode(valor).length > BYTES_MAXIMOS_CONTRASENA ? { contrasenaLarga: true } : null;
}

export const VALIDADORES_CONTRASENA: ValidatorFn[] = [Validators.required, contrasenaSegura];

export function contrasenasIguales(grupo: AbstractControl): ValidationErrors | null {
  const contrasena = grupo.get('contrasena')?.value as string | undefined;
  const confirmacion = grupo.get('confirmacion')?.value as string | undefined;
  return confirmacion === '' || contrasena === confirmacion ? null : { contrasenasDistintas: true };
}

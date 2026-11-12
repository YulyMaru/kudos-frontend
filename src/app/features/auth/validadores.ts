import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export const LONGITUD_MINIMA_CONTRASENA = 12;
export const BYTES_MAXIMOS_CONTRASENA = 72;
export const DOMINIO_INSTITUCIONAL = 'uco.edu.co';
export const PATRON_CELULAR = /^\+[1-9]\d{7,14}$/;
export const PATRON_CODIGO = /^\d{6}$/;

export function normalizarCelular(celular: string): string {
  return celular.replace(/[\s-]/g, '');
}

export function correoInstitucional(control: AbstractControl<string>): ValidationErrors | null {
  const valor = control.value.trim().toLowerCase();
  if (valor === '') {
    return null;
  }
  const dominio = valor.split('@')[1] ?? '';
  return dominio === DOMINIO_INSTITUCIONAL || dominio.endsWith(`.${DOMINIO_INSTITUCIONAL}`)
    ? null
    : { correoInstitucional: true };
}

export function celularInternacional(control: AbstractControl<string>): ValidationErrors | null {
  const valor = normalizarCelular(control.value);
  return valor === '' || PATRON_CELULAR.test(valor) ? null : { celular: true };
}

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

import { Pipe, PipeTransform } from '@angular/core';

const UNIDADES: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

const FORMATO = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

export function fechaRelativa(fecha: string, ahora: number = Date.now()): string {
  const segundos = Math.round((new Date(fecha).getTime() - ahora) / 1000);
  for (const [unidad, duracion] of UNIDADES) {
    if (Math.abs(segundos) >= duracion) {
      return FORMATO.format(Math.round(segundos / duracion), unidad);
    }
  }
  return 'hace un momento';
}

@Pipe({ name: 'fechaRelativa' })
export class FechaRelativaPipe implements PipeTransform {
  transform(fecha: string): string {
    return fechaRelativa(fecha);
  }
}

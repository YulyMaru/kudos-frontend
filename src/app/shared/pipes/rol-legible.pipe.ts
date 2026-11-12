import { Pipe, PipeTransform } from '@angular/core';
import { Rol } from '../models/sesion';

const NOMBRES: Record<Rol, string> = {
  ADMINISTRADOR: 'Administrador',
  RECTOR: 'Rector',
  COORDINADOR_ACADEMICO: 'Coordinador Académico',
  COORDINADOR_FACULTAD: 'Coordinador de Facultad',
  COORDINADOR_PROGRAMA: 'Coordinador de Programa',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
};

@Pipe({ name: 'rolLegible' })
export class RolLegiblePipe implements PipeTransform {
  transform(rol: Rol): string {
    return NOMBRES[rol];
  }
}

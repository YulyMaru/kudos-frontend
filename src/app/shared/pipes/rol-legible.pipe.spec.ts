import { RolLegiblePipe } from './rol-legible.pipe';

describe('RolLegiblePipe', () => {
  it('muestra el nombre legible de cada rol', () => {
    const pipe = new RolLegiblePipe();

    expect(pipe.transform('COORDINADOR_ACADEMICO')).toBe('Coordinador Académico');
    expect(pipe.transform('ESTUDIANTE')).toBe('Estudiante');
  });
});

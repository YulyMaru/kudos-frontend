import { fechaRelativa } from './fecha-relativa.pipe';
import { tamanoArchivo } from './tamano-archivo.pipe';

describe('pipes de formato', () => {
  const ahora = Date.parse('2026-11-11T12:00:00Z');

  it('expresa las fechas de forma relativa en español', () => {
    expect(fechaRelativa('2026-11-11T11:59:40Z', ahora)).toBe('hace un momento');
    expect(fechaRelativa('2026-11-11T11:55:00Z', ahora)).toBe('hace 5 minutos');
    expect(fechaRelativa('2026-11-11T09:00:00Z', ahora)).toBe('hace 3 horas');
    expect(fechaRelativa('2026-11-10T12:00:00Z', ahora)).toBe('ayer');
  });

  it('muestra el tamaño de los archivos en unidades legibles', () => {
    expect(tamanoArchivo(512)).toBe('512 B');
    expect(tamanoArchivo(2048)).toBe('2,0 KB');
    expect(tamanoArchivo(5 * 1024 * 1024)).toBe('5,0 MB');
  });
});

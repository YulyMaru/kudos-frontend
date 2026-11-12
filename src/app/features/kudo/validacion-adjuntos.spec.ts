import { TAMANO_MAXIMO_BYTES, validarAdjuntos } from './validacion-adjuntos';

function archivo(nombre: string, tipo: string, tamano = 10): File {
  const contenido = new File([new Uint8Array(tamano)], nombre, { type: tipo });
  return contenido;
}

describe('validarAdjuntos', () => {
  it('acepta JPG, PNG y PDF', () => {
    const resultado = validarAdjuntos([], [
      archivo('foto.jpg', 'image/jpeg'),
      archivo('logo.png', 'image/png'),
      archivo('acta.pdf', 'application/pdf'),
    ]);

    expect(resultado.aceptados.length).toBe(3);
    expect(resultado.errores).toEqual([]);
  });

  it('rechaza tipos no permitidos aunque cambien la extensión', () => {
    const resultado = validarAdjuntos([], [archivo('virus.png', 'application/x-msdownload'), archivo('nota.txt', 'text/plain')]);

    expect(resultado.aceptados).toEqual([]);
    expect(resultado.errores.length).toBe(2);
    expect(resultado.errores[0]).toContain('solo se permiten archivos JPG, PNG o PDF');
  });

  it('rechaza archivos de más de 5 MB y vacíos', () => {
    const resultado = validarAdjuntos([], [
      archivo('grande.pdf', 'application/pdf', TAMANO_MAXIMO_BYTES + 1),
      archivo('vacio.pdf', 'application/pdf', 0),
    ]);

    expect(resultado.aceptados).toEqual([]);
    expect(resultado.errores[0]).toContain('5 MB');
    expect(resultado.errores[1]).toContain('vacío');
  });

  it('no permite más de 5 adjuntos', () => {
    const actuales = Array.from({ length: 4 }, (_, i) => archivo(`f${i}.png`, 'image/png'));

    const resultado = validarAdjuntos(actuales, [archivo('quinto.png', 'image/png'), archivo('sexto.png', 'image/png')]);

    expect(resultado.aceptados.length).toBe(5);
    expect(resultado.errores).toEqual(['sexto.png: puedes adjuntar como máximo 5 archivos.']);
  });
});

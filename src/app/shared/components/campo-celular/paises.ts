export interface Pais {
  readonly iso: string;
  readonly nombre: string;
  readonly indicativo: string;
  readonly minimo: number;
  readonly maximo: number;
  readonly bandera: string;
}

function bandera(iso: string): string {
  return String.fromCodePoint(...Array.from(iso, (letra) => 0x1f1e6 + letra.charCodeAt(0) - 65));
}

function pais(iso: string, nombre: string, indicativo: string, minimo: number, maximo = minimo): Pais {
  return { iso, nombre, indicativo, minimo, maximo, bandera: bandera(iso) };
}

export const ISO_POR_DEFECTO = 'CO';

export const PAISES: readonly Pais[] = [
  pais('AR', 'Argentina', '54', 10, 11),
  pais('BS', 'Bahamas', '1', 10),
  pais('BB', 'Barbados', '1', 10),
  pais('BZ', 'Belice', '501', 7),
  pais('BO', 'Bolivia', '591', 8),
  pais('BR', 'Brasil', '55', 10, 11),
  pais('CA', 'Canadá', '1', 10),
  pais('CL', 'Chile', '56', 9),
  pais('CO', 'Colombia', '57', 10),
  pais('CR', 'Costa Rica', '506', 8),
  pais('CU', 'Cuba', '53', 8),
  pais('EC', 'Ecuador', '593', 9),
  pais('SV', 'El Salvador', '503', 8),
  pais('ES', 'España', '34', 9),
  pais('US', 'Estados Unidos', '1', 10),
  pais('GT', 'Guatemala', '502', 8),
  pais('GY', 'Guyana', '592', 7),
  pais('HT', 'Haití', '509', 8),
  pais('HN', 'Honduras', '504', 8),
  pais('JM', 'Jamaica', '1', 10),
  pais('MX', 'México', '52', 10),
  pais('NI', 'Nicaragua', '505', 8),
  pais('PA', 'Panamá', '507', 7, 8),
  pais('PY', 'Paraguay', '595', 9),
  pais('PE', 'Perú', '51', 9),
  pais('PR', 'Puerto Rico', '1', 10),
  pais('DO', 'República Dominicana', '1', 10),
  pais('SR', 'Surinam', '597', 7),
  pais('TT', 'Trinidad y Tobago', '1', 10),
  pais('UY', 'Uruguay', '598', 8),
  pais('VE', 'Venezuela', '58', 10),
];

export function paisPorIso(iso: string): Pais {
  return PAISES.find((opcion) => opcion.iso === iso) ?? paisPorIso(ISO_POR_DEFECTO);
}

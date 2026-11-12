export const MAXIMO_ADJUNTOS = 5;
export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;
export const TIPOS_PERMITIDOS: Readonly<Record<string, readonly string[]>> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'application/pdf': ['pdf'],
};
export const ACEPTAR_ARCHIVOS = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf';

export interface ResultadoAdjuntos {
  readonly aceptados: readonly File[];
  readonly errores: readonly string[];
}

function tipoValido(archivo: File): boolean {
  const extension = archivo.name.split('.').pop()?.toLowerCase() ?? '';
  const extensiones = TIPOS_PERMITIDOS[archivo.type];
  return extensiones !== undefined && extensiones.includes(extension);
}

export function validarAdjuntos(actuales: readonly File[], nuevos: readonly File[]): ResultadoAdjuntos {
  const aceptados = [...actuales];
  const errores: string[] = [];
  for (const archivo of nuevos) {
    if (!tipoValido(archivo)) {
      errores.push(`${archivo.name}: solo se permiten archivos JPG, PNG o PDF.`);
    } else if (archivo.size === 0) {
      errores.push(`${archivo.name}: el archivo está vacío.`);
    } else if (archivo.size > TAMANO_MAXIMO_BYTES) {
      errores.push(`${archivo.name}: supera el tamaño máximo de 5 MB.`);
    } else if (aceptados.length >= MAXIMO_ADJUNTOS) {
      errores.push(`${archivo.name}: puedes adjuntar como máximo ${MAXIMO_ADJUNTOS} archivos.`);
    } else {
      aceptados.push(archivo);
    }
  }
  return { aceptados, errores };
}

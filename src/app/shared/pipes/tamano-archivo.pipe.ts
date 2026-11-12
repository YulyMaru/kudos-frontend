import { Pipe, PipeTransform } from '@angular/core';

export function tamanoArchivo(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

@Pipe({ name: 'tamanoArchivo' })
export class TamanoArchivoPipe implements PipeTransform {
  transform(bytes: number): string {
    return tamanoArchivo(bytes);
  }
}

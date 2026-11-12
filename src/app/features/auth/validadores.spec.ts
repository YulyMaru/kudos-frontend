import { FormControl, FormGroup } from '@angular/forms';
import {
  celularInternacional,
  contrasenasIguales,
  contrasenaSegura,
  normalizarCelular,
} from './validadores';

function control(valor: string): FormControl<string> {
  return new FormControl(valor, { nonNullable: true });
}

describe('validadores de cuenta', () => {
  it('acepta celulares en formato internacional', () => {
    expect(celularInternacional(control('+57 300 123-4567'))).toBeNull();
    expect(celularInternacional(control('3001234567'))).toEqual({ celular: true });
    expect(normalizarCelular('+57 300 123-4567')).toBe('+573001234567');
  });

  it('aplica la política de contraseñas del back-end', () => {
    expect(contrasenaSegura(control('corta'))).toEqual({ contrasenaCorta: true });
    expect(contrasenaSegura(control('            '))).toEqual({ contrasenaCorta: true });
    expect(contrasenaSegura(control('una-clave-suficiente'))).toBeNull();
    expect(contrasenaSegura(control('ñ'.repeat(40)))).toEqual({ contrasenaLarga: true });
  });

  it('compara la contraseña con su confirmación', () => {
    const grupo = new FormGroup({ contrasena: control('una-clave-larga'), confirmacion: control('otra') });
    expect(contrasenasIguales(grupo)).toEqual({ contrasenasDistintas: true });

    grupo.controls.confirmacion.setValue('una-clave-larga');
    expect(contrasenasIguales(grupo)).toBeNull();
  });
});

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { CampoCelular, combinarCelular, describirLongitud, separarCelular, validarCelular } from './campo-celular';
import { paisPorIso } from './paises';

@Component({
  imports: [ReactiveFormsModule, CampoCelular],
  template: `
    <form [formGroup]="formulario">
      <app-campo-celular formControlName="celular" etiqueta="Celular con WhatsApp" />
    </form>
  `,
})
class Anfitrion {
  readonly formulario = new FormGroup({ celular: new FormControl('', { nonNullable: true }) });
}

describe('CampoCelular', () => {
  const colombia = paisPorIso('CO');
  let fixture: ComponentFixture<Anfitrion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Anfitrion] }).compileComponents();
    fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
  });

  function control(): FormControl<string> {
    return fixture.componentInstance.formulario.controls.celular;
  }

  function elemento(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function campo(): HTMLInputElement {
    return elemento().querySelector('input') as HTMLInputElement;
  }

  function componente(): CampoCelular {
    return fixture.debugElement.query(By.directive(CampoCelular)).componentInstance as CampoCelular;
  }

  function escribir(texto: string): void {
    campo().value = texto;
    campo().dispatchEvent(new Event('input'));
  }

  async function errorVisible(): Promise<string> {
    control().markAsTouched();
    await fixture.whenStable();
    return elemento().querySelector('mat-error')?.textContent?.trim() ?? '';
  }

  it('usa +57 Colombia por defecto y exige el número', async () => {
    expect(elemento().querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Celular con WhatsApp');
    expect(elemento().querySelector('.mat-mdc-select-value')?.textContent).toContain('+57');
    expect(elemento().textContent).toContain('Solo números, 10 dígitos');
    expect(control().value).toBe('');
    expect(control().hasError('required')).toBe(true);
    expect(await errorVisible()).toBe('Escribe tu número celular');
  });

  it('solo acepta dígitos y combina el indicativo con el número', () => {
    escribir('abc 300-123 4567');

    expect(campo().value).toBe('3001234567');
    expect(control().value).toBe('+573001234567');
    expect(control().valid).toBe(true);
  });

  it('no deja escribir más dígitos que el máximo del país', () => {
    escribir('300123456789');

    expect(campo().value).toBe('3001234567');
    expect(control().value).toBe('+573001234567');
  });

  it('valida la longitud mínima y muestra el error en español', async () => {
    escribir('300');

    expect(control().getError('celularLongitud')).toEqual({ minimo: 10, maximo: 10 });
    expect(await errorVisible()).toBe('El número debe tener 10 dígitos');
  });

  it('valida la longitud máxima al cambiar de indicativo', async () => {
    escribir('3001234567');

    componente()['elegirPais']('ES');
    await fixture.whenStable();

    expect(control().value).toBe('+343001234567');
    expect(control().getError('celularLongitud')).toEqual({ minimo: 9, maximo: 9 });
    expect(elemento().querySelector('.mat-mdc-select-value')?.textContent).toContain('+34');
    expect(await errorVisible()).toBe('El número debe tener 9 dígitos');
  });

  it('describe los rangos de longitud de cada país', async () => {
    componente()['elegirPais']('AR');
    escribir('1123456789');
    await fixture.whenStable();

    expect(control().value).toBe('+541123456789');
    expect(control().valid).toBe(true);
    expect(elemento().textContent).toContain('entre 10 y 11 dígitos');
  });

  it('separa un valor existente en indicativo y número', async () => {
    control().setValue('+34 612 345 678');
    await fixture.whenStable();

    expect(campo().value).toBe('612345678');
    expect(elemento().querySelector('.mat-mdc-select-value')?.textContent).toContain('+34');
    expect(control().valid).toBe(true);
  });

  it('marca el control como tocado al salir del campo', () => {
    campo().dispatchEvent(new Event('blur'));

    expect(control().touched).toBe(true);
  });

  it('combina, separa y valida celulares en el formato del back-end', () => {
    const estadosUnidos = paisPorIso('US');

    expect(combinarCelular(colombia, '3001234567')).toBe('+573001234567');
    expect(combinarCelular(colombia, '')).toBe('');
    expect(separarCelular('+1 809 555 1234', estadosUnidos)).toEqual({ pais: estadosUnidos, numero: '8095551234' });
    expect(separarCelular('+1 809 555 1234', colombia).pais.indicativo).toBe('1');
    expect(separarCelular('+593 99 123 4567', colombia)).toEqual({ pais: paisPorIso('EC'), numero: '991234567' });
    expect(separarCelular('300 123 4567', colombia)).toEqual({ pais: colombia, numero: '3001234567' });
    expect(separarCelular('+999', colombia)).toEqual({ pais: colombia, numero: '999' });
    expect(validarCelular('', colombia)).toEqual({ required: true });
    expect(validarCelular('+5730012345678', colombia)).toEqual({ celularLongitud: { minimo: 10, maximo: 10 } });
    expect(validarCelular('+573001234567', colombia)).toBeNull();
    expect(describirLongitud(paisPorIso('PA'))).toBe('entre 7 y 8 dígitos');
    expect(paisPorIso('XX')).toBe(colombia);
  });
});

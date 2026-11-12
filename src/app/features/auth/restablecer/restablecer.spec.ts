import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CuentaService } from '../cuenta.service';
import { Restablecer } from './restablecer';

describe('Restablecer', () => {
  const servicio = { solicitarRestablecimiento: vi.fn(), confirmarRestablecimiento: vi.fn() };
  let fixture: ComponentFixture<Restablecer>;
  let componente: Restablecer;

  beforeEach(async () => {
    servicio.solicitarRestablecimiento.mockReset();
    servicio.confirmarRestablecimiento.mockReset();
    await TestBed.configureTestingModule({
      imports: [Restablecer],
      providers: [provideRouter([]), { provide: CuentaService, useValue: servicio }],
    }).compileComponents();
    fixture = TestBed.createComponent(Restablecer);
    componente = fixture.componentInstance;
  });

  function texto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('sin token pide el correo y muestra la respuesta neutra', async () => {
    servicio.solicitarRestablecimiento.mockReturnValue(of({ mensaje: 'Si el correo pertenece a una cuenta activa' }));
    await fixture.whenStable();
    expect(texto()).toContain('Enviar enlace');

    componente['solicitud'].setValue({ correo: 'Ana@UCO.edu.co' });
    componente['solicitar']();
    await fixture.whenStable();

    expect(servicio.solicitarRestablecimiento).toHaveBeenCalledWith('ana@uco.edu.co');
    expect(texto()).toContain('Si el correo pertenece a una cuenta activa');
    expect(texto()).not.toContain('Enviar enlace');
  });

  it('con token exige contraseñas iguales y confirma el cambio', async () => {
    servicio.confirmarRestablecimiento.mockReturnValue(of({ mensaje: 'Contraseña actualizada' }));
    fixture.componentRef.setInput('token', 'tk-1');
    await fixture.whenStable();

    componente['confirmacion'].setValue({ contrasena: 'una-clave-larga', confirmacion: 'otra-clave-larga' });
    componente['confirmar']();
    expect(servicio.confirmarRestablecimiento).not.toHaveBeenCalled();

    componente['confirmacion'].setValue({ contrasena: 'una-clave-larga', confirmacion: 'una-clave-larga' });
    componente['confirmar']();
    await fixture.whenStable();

    expect(servicio.confirmarRestablecimiento).toHaveBeenCalledWith('tk-1', 'una-clave-larga');
    expect(texto()).toContain('Contraseña actualizada');
  });

  it('muestra el error si el enlace ya no es válido', async () => {
    servicio.confirmarRestablecimiento.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: { detail: 'El enlace expiró o ya fue usado' } })),
    );
    fixture.componentRef.setInput('token', 'tk-viejo');
    componente['confirmacion'].setValue({ contrasena: 'una-clave-larga', confirmacion: 'una-clave-larga' });

    componente['confirmar']();
    await fixture.whenStable();

    expect(texto()).toContain('El enlace expiró o ya fue usado');
    expect(texto()).toContain('Guardar contraseña');
  });
});

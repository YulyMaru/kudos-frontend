import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AvisosService } from '../../../shared/services/avisos.service';
import { CuentaService } from '../cuenta.service';
import { Verificar } from './verificar';

describe('Verificar', () => {
  const servicio = { verificar: vi.fn(), reenviarCodigo: vi.fn() };
  const mostrar = vi.fn();
  let fixture: ComponentFixture<Verificar>;
  let componente: Verificar;

  beforeEach(async () => {
    servicio.verificar.mockReset();
    servicio.reenviarCodigo.mockReset();
    mostrar.mockReset();
    await TestBed.configureTestingModule({
      imports: [Verificar],
      providers: [
        provideRouter([]),
        { provide: CuentaService, useValue: servicio },
        { provide: AvisosService, useValue: { mostrar } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Verificar);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('correo', 'Ana@uco.edu.co');
    await fixture.whenStable();
  });

  function texto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('toma el correo del enlace y no envía códigos incompletos', () => {
    componente['codigos'].CORREO.setValue('12');

    componente['verificar']('CORREO');

    expect(componente['campoCorreo'].value).toBe('Ana@uco.edu.co');
    expect(servicio.verificar).not.toHaveBeenCalled();
  });

  it('verifica cada canal y avisa cuando ambos quedan listos', async () => {
    servicio.verificar.mockReturnValue(of({ mensaje: 'Dato verificado correctamente' }));

    componente['codigos'].CORREO.setValue('123456');
    componente['verificar']('CORREO');
    componente['codigos'].CELULAR.setValue('654321');
    componente['verificar']('CELULAR');
    await fixture.whenStable();

    expect(servicio.verificar).toHaveBeenCalledWith('ana@uco.edu.co', 'CORREO', '123456');
    expect(servicio.verificar).toHaveBeenCalledWith('ana@uco.edu.co', 'CELULAR', '654321');
    expect(texto()).toContain('Tus datos quedaron verificados');
    expect(mostrar).toHaveBeenCalledTimes(2);
    expect(mostrar).toHaveBeenCalledWith('Código verificado');
  });

  it('muestra el rechazo del código y permite reenviarlo', async () => {
    servicio.verificar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: { detail: 'El código expiró o es incorrecto' } })),
    );
    servicio.reenviarCodigo.mockReturnValue(of({ mensaje: 'Enviamos un nuevo código' }));

    componente['codigos'].CELULAR.setValue('000000');
    componente['verificar']('CELULAR');
    await fixture.whenStable();
    expect(texto()).toContain('El código expiró o es incorrecto');
    expect(mostrar).not.toHaveBeenCalled();

    componente['reenviar']('CELULAR');
    await fixture.whenStable();

    expect(servicio.reenviarCodigo).toHaveBeenCalledWith('ana@uco.edu.co', 'CELULAR');
    expect(componente['codigos'].CELULAR.value).toBe('');
    expect(texto()).toContain('Enviamos un nuevo código');
  });
});

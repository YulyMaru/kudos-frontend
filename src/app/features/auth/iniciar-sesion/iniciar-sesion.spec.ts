import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SesionService } from '../../../core/auth/sesion.service';
import { destinoSeguro, IniciarSesion } from './iniciar-sesion';

describe('IniciarSesion', () => {
  const iniciarSesion = vi.fn();
  let fixture: ComponentFixture<IniciarSesion>;
  let router: Router;

  beforeEach(async () => {
    iniciarSesion.mockReset();
    await TestBed.configureTestingModule({
      imports: [IniciarSesion],
      providers: [provideRouter([]), { provide: SesionService, useValue: { iniciarSesion } }],
    }).compileComponents();
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(IniciarSesion);
    await fixture.whenStable();
  });

  function escribir(selector: string, valor: string): void {
    const campo = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(selector);
    if (campo === null) {
      throw new Error(`No existe ${selector}`);
    }
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  function enviar(): void {
    (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(new Event('submit'));
  }

  it('no envía el formulario si faltan datos', async () => {
    enviar();
    await fixture.whenStable();

    expect(iniciarSesion).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Escribe tu correo institucional');
  });

  it('inicia sesión y navega al destino solicitado', async () => {
    iniciarSesion.mockReturnValue(of({ id: '1', nombreCompleto: 'Ana', rol: 'DOCENTE' }));
    fixture.componentRef.setInput('volver', '/kudos/123');
    escribir('input[type=email]', ' ana@uco.edu.co ');
    escribir('input[formControlName=contrasena]', 'Clave-Segura-2026');

    enviar();
    await fixture.whenStable();

    expect(iniciarSesion).toHaveBeenCalledWith('ana@uco.edu.co', 'Clave-Segura-2026');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/kudos/123');
  });

  it('muestra el mensaje del back-end cuando las credenciales no son válidas', async () => {
    iniciarSesion.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, error: { detail: 'Correo o contraseña incorrectos' } })),
    );
    escribir('input[type=email]', 'ana@uco.edu.co');
    escribir('input[formControlName=contrasena]', 'mala');

    enviar();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role=alert]')?.textContent).toContain(
      'Correo o contraseña incorrectos',
    );
  });

  it('solo acepta destinos internos para evitar redirecciones abiertas', () => {
    expect(destinoSeguro('/kudos/1')).toBe('/kudos/1');
    expect(destinoSeguro('//sitio-malicioso.com')).toBe('/feed');
    expect(destinoSeguro('https://sitio-malicioso.com')).toBe('/feed');
    expect(destinoSeguro(undefined)).toBe('/feed');
  });
});

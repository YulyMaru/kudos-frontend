import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CuentaService } from '../cuenta.service';
import { Registro, requiereFacultad, requierePrograma } from './registro';

describe('Registro', () => {
  const servicio = {
    facultades: vi.fn(() => of([{ id: 'f1', nombre: 'Ingeniería', activa: true }])),
    programas: vi.fn(() => of([{ id: 'p1', facultadId: 'f1', nombre: 'Sistemas', activo: true }])),
    registrar: vi.fn(),
  };
  const abrirAviso = vi.fn();
  let fixture: ComponentFixture<Registro>;
  let componente: Registro;
  let router: Router;

  beforeEach(async () => {
    servicio.registrar.mockReset();
    servicio.programas.mockClear();
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [
        provideRouter([]),
        { provide: CuentaService, useValue: servicio },
        { provide: MatSnackBar, useValue: { open: abrirAviso } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(Registro);
    componente = fixture.componentInstance;
    await fixture.whenStable();
  });

  function formulario() {
    return componente['formulario'];
  }

  function completar(): void {
    formulario().patchValue({
      nombreCompleto: ' Ana Pérez ',
      correo: 'Ana@UCO.edu.co',
      celular: '+57 300 123 4567',
      rol: 'ESTUDIANTE',
    });
    formulario().controls.facultadId.setValue('f1');
    formulario().patchValue({
      programaId: 'p1',
      contrasena: 'una-clave-larga',
      confirmacion: 'una-clave-larga',
      aceptaPolitica: true,
    });
  }

  it('sabe qué roles piden programa o facultad', () => {
    expect(requierePrograma('DOCENTE')).toBe(true);
    expect(requierePrograma('RECTOR')).toBe(false);
    expect(requiereFacultad('COORDINADOR_FACULTAD')).toBe(true);
    expect(requiereFacultad('ESTUDIANTE')).toBe(false);
  });

  it('exige programa a los estudiantes y carga los programas de la facultad elegida', async () => {
    formulario().controls.rol.setValue('ESTUDIANTE');
    expect(formulario().controls.programaId.hasError('required')).toBe(true);

    formulario().controls.facultadId.setValue('f1');
    TestBed.tick();
    await fixture.whenStable();

    expect(servicio.programas).toHaveBeenCalledWith('f1');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Programa');
  });

  it('no envía sin aceptar la política de datos', async () => {
    completar();
    formulario().controls.aceptaPolitica.setValue(false);

    componente['registrar']();
    await fixture.whenStable();

    expect(servicio.registrar).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Debes aceptar la política');
  });

  it('envía los datos normalizados y lleva a verificar', () => {
    servicio.registrar.mockReturnValue(of({ mensaje: 'Solicitud registrada' }));
    completar();

    componente['registrar']();

    expect(servicio.registrar).toHaveBeenCalledWith({
      nombreCompleto: 'Ana Pérez',
      correo: 'ana@uco.edu.co',
      celular: '+573001234567',
      rol: 'ESTUDIANTE',
      facultadId: null,
      programaId: 'p1',
      contrasena: 'una-clave-larga',
      aceptaPolitica: true,
    });
    expect(abrirAviso).toHaveBeenCalledWith('Solicitud registrada', 'Cerrar', { duration: 8000 });
    expect(router.navigate).toHaveBeenCalledWith(['/verificar'], { queryParams: { correo: 'ana@uco.edu.co' } });
  });

  it('muestra el error del back-end', async () => {
    servicio.registrar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: { detail: 'Ya existe una cuenta asociada' } })),
    );
    completar();

    componente['registrar']();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role=alert]')?.textContent).toContain(
      'Ya existe una cuenta asociada',
    );
  });
});

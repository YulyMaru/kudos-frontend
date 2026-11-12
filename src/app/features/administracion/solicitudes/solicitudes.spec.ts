import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of, throwError } from 'rxjs';
import { SolicitudPendiente } from '../../../shared/models/solicitud';
import { DialogoRechazar } from './dialogo-rechazar';
import { Solicitudes } from './solicitudes';
import { SolicitudesService } from './solicitudes.service';

describe('Solicitudes', () => {
  const solicitud: SolicitudPendiente = {
    id: 's1',
    usuarioId: 'u1',
    nombreCompleto: 'Ana Docente',
    correo: 'ana@uco.edu.co',
    rolSolicitado: 'DOCENTE',
    facultad: 'Ingeniería',
    programa: 'Sistemas',
    correoVerificado: true,
    celularVerificado: false,
    creadaEn: new Date().toISOString(),
  };
  const servicio = { listar: vi.fn(), aprobar: vi.fn(), rechazar: vi.fn() };
  const abrirAviso = vi.fn();
  const abrirDialogo = vi.fn();
  let fixture: ComponentFixture<Solicitudes>;

  beforeEach(async () => {
    Object.values(servicio).forEach((simulado) => simulado.mockReset());
    abrirAviso.mockReset();
    abrirDialogo.mockReset();
    servicio.listar.mockReturnValue(of([solicitud]));
    await TestBed.configureTestingModule({
      imports: [Solicitudes],
      providers: [
        { provide: SolicitudesService, useValue: servicio },
        { provide: MatSnackBar, useValue: { open: abrirAviso } },
        { provide: MatDialog, useValue: { open: abrirDialogo } },
      ],
    }).compileComponents();
  });

  async function crear(): Promise<void> {
    fixture = TestBed.createComponent(Solicitudes);
    await fixture.whenStable();
  }

  function texto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function botonCon(etiqueta: string): HTMLButtonElement {
    const boton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find((b) =>
      b.textContent?.includes(etiqueta),
    );
    if (boton === undefined) {
      throw new Error(`No existe el botón ${etiqueta}`);
    }
    return boton;
  }

  it('muestra los datos de cada solicitud', async () => {
    await crear();

    expect(texto()).toContain('Ana Docente');
    expect(texto()).toContain('ana@uco.edu.co');
    expect(texto().replace(/\s+/g, ' ')).toContain('Docente · Ingeniería · Sistemas');
    expect(texto()).toContain('Correo verificado');
    expect(texto()).toContain('Celular sin verificar');
    expect(texto()).toContain('hace un momento');
  });

  it('muestra el esqueleto mientras carga', () => {
    servicio.listar.mockReturnValue(new Observable<never>());
    fixture = TestBed.createComponent(Solicitudes);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-esqueleto-tarjeta')).not.toBeNull();
  });

  it('muestra el estado vacío', async () => {
    servicio.listar.mockReturnValue(of([]));
    await crear();

    expect(texto()).toContain('No hay solicitudes pendientes');
  });

  it('muestra el error y permite reintentar', async () => {
    servicio.listar.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 500, error: { detail: 'Servicio no disponible' } })),
    );
    await crear();
    expect(texto()).toContain('Servicio no disponible');

    botonCon('Reintentar').click();
    await fixture.whenStable();

    expect(texto()).toContain('Ana Docente');
  });

  it('aprueba, quita la tarjeta y confirma con un aviso', async () => {
    servicio.aprobar.mockReturnValue(of(undefined));
    await crear();

    botonCon('Aprobar').click();
    await fixture.whenStable();

    expect(servicio.aprobar).toHaveBeenCalledWith('s1');
    expect(texto()).toContain('No hay solicitudes pendientes');
    expect(abrirAviso).toHaveBeenCalledWith('Solicitud aprobada', 'Cerrar', { duration: 4000 });
  });

  it('rechaza con el motivo del diálogo, quita la tarjeta y confirma', async () => {
    abrirDialogo.mockReturnValue({ afterClosed: () => of('Datos incompletos') });
    servicio.rechazar.mockReturnValue(of(undefined));
    await crear();

    botonCon('Rechazar').click();
    await fixture.whenStable();

    expect(abrirDialogo).toHaveBeenCalledWith(DialogoRechazar, expect.objectContaining({ data: 'Ana Docente' }));
    expect(servicio.rechazar).toHaveBeenCalledWith('s1', 'Datos incompletos');
    expect(texto()).toContain('No hay solicitudes pendientes');
    expect(abrirAviso).toHaveBeenCalledWith('Solicitud rechazada', 'Cerrar', { duration: 4000 });
  });

  it('no rechaza si se cancela el diálogo', async () => {
    abrirDialogo.mockReturnValue({ afterClosed: () => of(undefined) });
    await crear();

    botonCon('Rechazar').click();

    expect(servicio.rechazar).not.toHaveBeenCalled();
    expect(texto()).toContain('Ana Docente');
  });

  it('muestra el detalle del error y conserva la tarjeta', async () => {
    servicio.aprobar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'La solicitud ya fue resuelta' } })),
    );
    await crear();

    botonCon('Aprobar').click();
    await fixture.whenStable();

    expect(abrirAviso).toHaveBeenCalledWith('La solicitud ya fue resuelta', 'Cerrar', { duration: 6000 });
    expect(texto()).toContain('Ana Docente');
  });
});

describe('DialogoRechazar', () => {
  const cerrar = vi.fn();

  beforeEach(async () => {
    cerrar.mockReset();
    await TestBed.configureTestingModule({
      imports: [DialogoRechazar],
      providers: [
        { provide: MatDialogRef, useValue: { close: cerrar } },
        { provide: MAT_DIALOG_DATA, useValue: 'Ana Docente' },
      ],
    }).compileComponents();
  });

  it('exige un motivo y lo devuelve sin espacios sobrantes', async () => {
    const fixture = TestBed.createComponent(DialogoRechazar);
    await fixture.whenStable();
    const formulario = (fixture.nativeElement as HTMLElement).querySelector('form') as HTMLFormElement;

    formulario.dispatchEvent(new Event('submit'));
    expect(cerrar).not.toHaveBeenCalled();

    fixture.componentInstance['formulario'].setValue({ motivo: '  Datos incompletos  ' });
    formulario.dispatchEvent(new Event('submit'));

    expect(cerrar).toHaveBeenCalledWith('Datos incompletos');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ana Docente');
  });
});

import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AvisosService } from '../../../shared/services/avisos.service';
import { InteraccionesService } from '../interacciones.service';
import { BotonReportar } from './boton-reportar';
import { DialogoReportar } from './dialogo-reportar';

describe('BotonReportar', () => {
  const reportar = vi.fn();
  const avisos = { mostrar: vi.fn(), error: vi.fn() };
  const abrirDialogo = vi.fn();
  let fixture: ComponentFixture<BotonReportar>;

  beforeEach(async () => {
    reportar.mockReset();
    avisos.mostrar.mockReset();
    avisos.error.mockReset();
    abrirDialogo.mockReset();
    await TestBed.configureTestingModule({
      imports: [BotonReportar],
      providers: [
        { provide: InteraccionesService, useValue: { reportar } },
        { provide: AvisosService, useValue: avisos },
        { provide: MatDialog, useValue: { open: abrirDialogo } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BotonReportar);
    fixture.componentRef.setInput('tipo', 'REPLICA');
    fixture.componentRef.setInput('contenidoId', 'r1');
    await fixture.whenStable();
  });

  function boton(): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
  }

  it('envía el motivo escrito en el diálogo y queda como reportado', async () => {
    abrirDialogo.mockReturnValue({ afterClosed: () => of('Contenido ofensivo') });
    reportar.mockReturnValue(of(undefined));

    boton().click();
    await fixture.whenStable();

    expect(abrirDialogo).toHaveBeenCalledWith(DialogoReportar, expect.objectContaining({ data: 'REPLICA' }));
    expect(reportar).toHaveBeenCalledWith('REPLICA', 'r1', 'Contenido ofensivo');
    expect(boton().textContent).toContain('Reportado');
    expect(boton().disabled).toBe(true);
    expect(avisos.mostrar).toHaveBeenCalledWith('Gracias. Tu reporte quedó registrado para revisión');
  });

  it('no reporta si se cancela el diálogo', () => {
    abrirDialogo.mockReturnValue({ afterClosed: () => of(undefined) });

    boton().click();

    expect(reportar).not.toHaveBeenCalled();
  });

  it('muestra el error del back-end', () => {
    abrirDialogo.mockReturnValue({ afterClosed: () => of('Spam') });
    reportar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: { detail: 'Ya reportaste este contenido' } })),
    );

    boton().click();

    expect(avisos.error).toHaveBeenCalledWith('Ya reportaste este contenido');
  });
});

describe('DialogoReportar', () => {
  const cerrar = vi.fn();

  beforeEach(async () => {
    cerrar.mockReset();
    await TestBed.configureTestingModule({
      imports: [DialogoReportar],
      providers: [
        { provide: MatDialogRef, useValue: { close: cerrar } },
        { provide: MAT_DIALOG_DATA, useValue: 'KUDO' },
      ],
    }).compileComponents();
  });

  it('exige un motivo y lo devuelve sin espacios sobrantes', async () => {
    const fixture = TestBed.createComponent(DialogoReportar);
    await fixture.whenStable();
    const formulario = (fixture.nativeElement as HTMLElement).querySelector('form') as HTMLFormElement;

    formulario.dispatchEvent(new Event('submit'));
    expect(cerrar).not.toHaveBeenCalled();

    fixture.componentInstance['formulario'].setValue({ motivo: '  Lenguaje ofensivo  ' });
    formulario.dispatchEvent(new Event('submit'));

    expect(cerrar).toHaveBeenCalledWith('Lenguaje ofensivo');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Reportar Kudo');
  });
});

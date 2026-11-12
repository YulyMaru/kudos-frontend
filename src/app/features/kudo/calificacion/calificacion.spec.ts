import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { InteraccionesService } from '../interacciones.service';
import { Calificacion } from './calificacion';

describe('Calificacion', () => {
  const calificar = vi.fn();
  const abrirAviso = vi.fn();
  let fixture: ComponentFixture<Calificacion>;

  beforeEach(async () => {
    calificar.mockReset();
    abrirAviso.mockReset();
    await TestBed.configureTestingModule({
      imports: [Calificacion],
      providers: [
        { provide: InteraccionesService, useValue: { calificar } },
        { provide: MatSnackBar, useValue: { open: abrirAviso } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Calificacion);
    fixture.componentRef.setInput('tipo', 'KUDO');
    fixture.componentRef.setInput('contenidoId', 'k1');
    fixture.componentRef.setInput('promedio', 0);
    fixture.componentRef.setInput('cantidad', 0);
    await fixture.whenStable();
  });

  function elemento(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('ofrece cinco estrellas accesibles', () => {
    const botones = elemento().querySelectorAll('button');

    expect(botones.length).toBe(5);
    expect(botones[0].getAttribute('aria-label')).toBe('Calificar con 1 estrella');
    expect(botones[4].getAttribute('aria-label')).toBe('Calificar con 5 estrellas');
    expect(elemento().textContent).toContain('Sin calificaciones');
  });

  it('guarda la calificación y muestra el nuevo promedio', async () => {
    calificar.mockReturnValue(
      of({ tipoContenido: 'KUDO', contenidoId: 'k1', promedio: 4.5, cantidad: 2, miCalificacion: 4 }),
    );

    elemento().querySelectorAll('button')[3].click();
    await fixture.whenStable();

    expect(calificar).toHaveBeenCalledWith('KUDO', 'k1', 4);
    expect(elemento().textContent).toMatch(/4[.,]5/);
    expect(elemento().textContent).toContain('2 calificaciones');
    expect(elemento().textContent).toContain('Tu calificación: 4');
    expect(elemento().querySelectorAll('button')[3].getAttribute('aria-pressed')).toBe('true');
    expect(elemento().querySelectorAll('mat-icon.llena').length).toBe(4);
  });

  it('avisa si el back-end rechaza la calificación', () => {
    calificar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: { detail: 'No puedes calificar tu propio Kudo' } })),
    );

    elemento().querySelectorAll('button')[0].click();

    expect(abrirAviso).toHaveBeenCalledWith('No puedes calificar tu propio Kudo', 'Cerrar', { duration: 6000 });
  });
});

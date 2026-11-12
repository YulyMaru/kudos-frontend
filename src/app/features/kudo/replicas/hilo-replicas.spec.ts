import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { ReplicaVista } from '../../../shared/models/interaccion';
import { InteraccionesService } from '../interacciones.service';
import { HiloReplicas } from './hilo-replicas';

describe('HiloReplicas', () => {
  const replica: ReplicaVista = {
    id: 'r1',
    kudoId: 'k1',
    replicaPadreId: null,
    autor: { id: 'u1', nombreCompleto: 'Luis Estudiante', rol: 'ESTUDIANTE' },
    contenido: '¡Muy merecido!',
    fechaPublicacion: '2026-11-11T15:00:00Z',
    cantidadRespuestas: 1,
    promedioCalificacion: 0,
    cantidadCalificaciones: 0,
  };
  const respuesta: ReplicaVista = { ...replica, id: 'r2', replicaPadreId: 'r1', contenido: 'Totalmente de acuerdo', cantidadRespuestas: 0 };
  const servicio = { replicas: vi.fn(), publicarReplica: vi.fn(), calificar: vi.fn(), reportar: vi.fn() };
  let fixture: ComponentFixture<HiloReplicas>;
  let componente: HiloReplicas;

  beforeEach(async () => {
    Object.values(servicio).forEach((simulado) => simulado.mockReset());
    servicio.replicas.mockImplementation((_kudo: string, padre: string | null, cursor: string | null) => {
      if (padre === 'r1') {
        return of({ replicas: [respuesta], siguienteCursor: null });
      }
      return cursor === null
        ? of({ replicas: [replica], siguienteCursor: 'c2' })
        : of({ replicas: [{ ...replica, id: 'r3', contenido: 'Otra más', cantidadRespuestas: 0 }], siguienteCursor: null });
    });
    await TestBed.configureTestingModule({
      imports: [HiloReplicas],
      providers: [
        { provide: InteraccionesService, useValue: servicio },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HiloReplicas);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('kudoId', 'k1');
    await fixture.whenStable();
  });

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

  it('carga las réplicas raíz y pagina con el cursor', async () => {
    expect(servicio.replicas).toHaveBeenCalledWith('k1', null, null);
    expect(texto()).toContain('¡Muy merecido!');

    botonCon('Cargar más réplicas').click();
    await fixture.whenStable();

    expect(servicio.replicas).toHaveBeenCalledWith('k1', null, 'c2');
    expect(texto()).toContain('Otra más');
    expect(texto()).not.toContain('Cargar más réplicas');
  });

  it('despliega las respuestas anidadas de una réplica', async () => {
    botonCon('Ver respuestas (1)').click();
    await fixture.whenStable();

    expect(servicio.replicas).toHaveBeenCalledWith('k1', 'r1', null);
    expect(texto()).toContain('Totalmente de acuerdo');
    expect(texto()).toContain('Ocultar respuestas');
  });

  it('publica una réplica raíz, recarga el hilo y lo notifica', async () => {
    const publicadas: unknown[] = [];
    componente.publicada.subscribe(() => publicadas.push(true));
    servicio.publicarReplica.mockReturnValue(of({ id: 'r9', kudoId: 'k1', replicaPadreId: null, fechaPublicacion: 'x' }));
    const formulario = (fixture.nativeElement as HTMLElement).querySelector('app-formulario-replica form') as HTMLFormElement;
    const campo = formulario.querySelector('textarea') as HTMLTextAreaElement;

    campo.value = '  Felicitaciones  ';
    campo.dispatchEvent(new Event('input'));
    formulario.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(servicio.publicarReplica).toHaveBeenCalledWith('k1', 'Felicitaciones', null);
    expect(servicio.replicas).toHaveBeenCalledTimes(2);
    expect(publicadas.length).toBe(1);
  });

  it('responde a una réplica y abre sus respuestas con el contador actualizado', async () => {
    servicio.publicarReplica.mockReturnValue(of({ id: 'r9', kudoId: 'k1', replicaPadreId: 'r1', fechaPublicacion: 'x' }));

    botonCon('Responder').click();
    await fixture.whenStable();
    const formularios = (fixture.nativeElement as HTMLElement).querySelectorAll('app-formulario-replica form');
    const formulario = formularios[formularios.length - 1] as HTMLFormElement;
    const campo = formulario.querySelector('textarea') as HTMLTextAreaElement;
    expect(texto()).toContain('Responder a Luis Estudiante');

    campo.value = 'Gracias';
    campo.dispatchEvent(new Event('input'));
    formulario.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(servicio.publicarReplica).toHaveBeenCalledWith('k1', 'Gracias', 'r1');
    expect(texto()).toContain('Ocultar respuestas');
    expect(servicio.replicas).toHaveBeenCalledWith('k1', 'r1', null);
    componente['alternarRespuestas'](replica);
    await fixture.whenStable();
    expect(texto()).toContain('Ver respuestas (2)');
  });

  it('muestra el error y permite reintentar', async () => {
    servicio.replicas.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 500, error: { detail: 'Servicio no disponible' } })),
    );
    componente['reintentar']();
    await fixture.whenStable();
    expect(texto()).toContain('Servicio no disponible');

    botonCon('Reintentar').click();
    await fixture.whenStable();

    expect(texto()).toContain('¡Muy merecido!');
  });
});

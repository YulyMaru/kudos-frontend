import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { InteraccionesService } from '../interacciones.service';
import { FormularioReplica } from './formulario-replica';

describe('FormularioReplica', () => {
  const publicarReplica = vi.fn();
  let fixture: ComponentFixture<FormularioReplica>;

  beforeEach(async () => {
    publicarReplica.mockReset();
    await TestBed.configureTestingModule({
      imports: [FormularioReplica],
      providers: [{ provide: InteraccionesService, useValue: { publicarReplica } }],
    }).compileComponents();
    fixture = TestBed.createComponent(FormularioReplica);
    fixture.componentRef.setInput('kudoId', 'k1');
    await fixture.whenStable();
  });

  function enviar(contenido: string): void {
    const elemento = fixture.nativeElement as HTMLElement;
    const campo = elemento.querySelector('textarea') as HTMLTextAreaElement;
    campo.value = contenido;
    campo.dispatchEvent(new Event('input'));
    (elemento.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
  }

  it('no envía una réplica vacía o con solo espacios', async () => {
    enviar('   ');
    await fixture.whenStable();

    expect(publicarReplica).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Escribe tu réplica');
  });

  it('emite la réplica publicada y limpia el campo', async () => {
    const replica = { id: 'r1', kudoId: 'k1', replicaPadreId: null, fechaPublicacion: 'x' };
    const emitidas: unknown[] = [];
    fixture.componentInstance.publicada.subscribe((publicada) => emitidas.push(publicada));
    publicarReplica.mockReturnValue(of(replica));

    enviar(' Gracias ');
    await fixture.whenStable();

    expect(publicarReplica).toHaveBeenCalledWith('k1', 'Gracias', null);
    expect(emitidas).toEqual([replica]);
    expect(fixture.componentInstance['formulario'].getRawValue().contenido).toBe('');
  });

  it('muestra el detalle del error y permite reenviar', async () => {
    publicarReplica.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: { detail: 'Contenido no permitido' } })),
    );

    enviar('Hola');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('Contenido no permitido');
    expect((fixture.nativeElement as HTMLElement).querySelector('button')?.disabled).toBe(false);
  });
});

import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PersonaVista } from '../../../shared/models/kudo';
import { KudoService } from '../kudo.service';
import { ESPERA_BUSQUEDA_MS, personaSeleccionada, PublicarKudo } from './publicar-kudo';

describe('PublicarKudo', () => {
  const diego: PersonaVista = { id: 'd1', nombreCompleto: 'Diego Estudiante', rol: 'ESTUDIANTE' };
  const servicio = {
    categorias: vi.fn(),
    buscarUsuarios: vi.fn(),
    publicar: vi.fn(),
  };
  const abrirAviso = vi.fn();
  let fixture: ComponentFixture<PublicarKudo>;
  let componente: PublicarKudo;
  let router: Router;

  beforeEach(async () => {
    servicio.categorias.mockReturnValue(of([{ id: 'c1', nombre: 'Liderazgo' }]));
    servicio.buscarUsuarios.mockReturnValue(of([diego]));
    servicio.publicar.mockReset();
    abrirAviso.mockReset();
    await TestBed.configureTestingModule({
      imports: [PublicarKudo],
      providers: [
        provideRouter([]),
        { provide: KudoService, useValue: servicio },
        { provide: MatSnackBar, useValue: { open: abrirAviso } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(PublicarKudo);
    componente = fixture.componentInstance;
    await fixture.whenStable();
  });

  function completar(): void {
    componente['formulario'].setValue({ destinatario: diego, categoriaId: 'c1', contenido: 'Gracias por tu apoyo' });
  }

  function enviar(): void {
    (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(new Event('submit'));
  }

  it('no publica si falta elegir al destinatario de la lista', async () => {
    componente['formulario'].setValue({ destinatario: 'Diego', categoriaId: 'c1', contenido: 'Hola' });

    enviar();
    await fixture.whenStable();

    expect(servicio.publicar).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Elige a la persona de la lista');
  });

  it('publica sin adjuntos, avisa y lleva al detalle del Kudo', async () => {
    servicio.publicar.mockReturnValue(of({ id: 'k1', fechaPublicacion: '2026-11-11T10:00:00Z' }));
    completar();

    enviar();
    await fixture.whenStable();

    expect(servicio.publicar).toHaveBeenCalledWith(
      { destinatarioId: 'd1', categoriaId: 'c1', contenido: 'Gracias por tu apoyo' },
      [],
    );
    expect(abrirAviso).toHaveBeenCalledWith('¡Kudo publicado para Diego Estudiante!', 'Cerrar', { duration: 5000 });
    expect(router.navigate).toHaveBeenCalledWith(['/kudos', 'k1']);
  });

  it('envía los adjuntos válidos y descarta los inválidos con un mensaje', async () => {
    servicio.publicar.mockReturnValue(of({ id: 'k2', fechaPublicacion: '2026-11-11T10:00:00Z' }));
    const pdf = new File(['%PDF'], 'acta.pdf', { type: 'application/pdf' });
    const ejecutable = new File(['MZ'], 'foto.png', { type: 'application/x-msdownload' });
    componente['agregarArchivos']([pdf, ejecutable]);
    completar();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('foto.png: solo se permiten archivos JPG, PNG o PDF.');
    enviar();
    await fixture.whenStable();

    expect(servicio.publicar).toHaveBeenCalledWith(expect.anything(), [pdf]);
  });

  it('muestra el mensaje del back-end si la publicación falla', async () => {
    servicio.publicar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: { detail: 'No es posible publicar un Kudo para uno mismo' } })),
    );
    completar();

    enviar();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('.error')?.textContent).toContain(
      'No es posible publicar un Kudo para uno mismo',
    );
  });

  it('busca destinatarios después de una pausa al escribir', () => {
    vi.useFakeTimers();
    try {
      componente['buscarPersonas']('d');
      vi.advanceTimersByTime(ESPERA_BUSQUEDA_MS);
      expect(servicio.buscarUsuarios).not.toHaveBeenCalled();

      componente['buscarPersonas']('die');
      vi.advanceTimersByTime(ESPERA_BUSQUEDA_MS);

      expect(servicio.buscarUsuarios).toHaveBeenCalledWith('die');
      expect(componente['sugerencias']()).toEqual([diego]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('el validador exige una persona seleccionada', () => {
    expect(personaSeleccionada({ value: diego } as never)).toBeNull();
    expect(personaSeleccionada({ value: 'Diego' } as never)).toEqual({ personaSeleccionada: true });
    expect(personaSeleccionada({ value: null } as never)).toEqual({ personaSeleccionada: true });
  });
});

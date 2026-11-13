import { TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ACCION_CERRAR_AVISO, AvisosService, DURACION_AVISO_MS } from './avisos.service';

describe('AvisosService', () => {
  describe('configuración', () => {
    const open = vi.fn();
    let avisos: AvisosService;

    beforeEach(() => {
      open.mockReset();
      TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: { open } }] });
      avisos = TestBed.inject(AvisosService);
    });

    it('muestra confirmaciones de 4 s con botón cerrar y anuncio cortés', () => {
      avisos.mostrar('Kudo publicado');

      expect(open).toHaveBeenCalledWith('Kudo publicado', 'Cerrar', {
        duration: 4000,
        panelClass: ['aviso', 'aviso-confirmacion'],
        politeness: 'polite',
      });
    });

    it('muestra los errores con estilo de error y anuncio inmediato', () => {
      avisos.error('No hay conexión con el servidor');

      expect(open).toHaveBeenCalledWith('No hay conexión con el servidor', ACCION_CERRAR_AVISO, {
        duration: DURACION_AVISO_MS,
        panelClass: ['aviso', 'aviso-error'],
        politeness: 'assertive',
      });
    });
  });

  describe('en pantalla', () => {
    let avisos: AvisosService;

    beforeEach(() => {
      vi.useFakeTimers();
      TestBed.configureTestingModule({
        providers: [{ provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }],
      });
      avisos = TestBed.inject(AvisosService);
    });

    afterEach(() => vi.useRealTimers());

    function contenedor(): HTMLElement | null {
      return document.querySelector('.mat-mdc-snack-bar-container');
    }

    async function avanzar(ms: number): Promise<void> {
      await vi.advanceTimersByTimeAsync(ms);
      TestBed.tick();
    }

    it('se cierra solo a los 4 segundos', async () => {
      avisos.error('Ocurrió un error inesperado');
      await avanzar(0);

      expect(contenedor()?.classList).toContain('aviso-error');
      expect(document.querySelector('[aria-live="assertive"]')).not.toBeNull();

      await avanzar(DURACION_AVISO_MS - 100);
      expect(contenedor()).not.toBeNull();

      await avanzar(200);
      expect(contenedor()).toBeNull();
    });

    it('se cierra con el botón Cerrar', async () => {
      avisos.mostrar('Sesión cerrada');
      await avanzar(0);

      const boton = contenedor()?.querySelector('button');
      expect(boton?.textContent).toContain('Cerrar');
      boton?.click();
      await avanzar(0);

      expect(contenedor()).toBeNull();
    });
  });
});

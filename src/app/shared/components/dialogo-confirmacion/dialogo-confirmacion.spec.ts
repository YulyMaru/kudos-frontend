import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogoInactividad, ID_MENSAJE_INACTIVIDAD } from '../../../core/auth/dialogo-inactividad';
import { CONFIGURACION_DIALOGO, confirmar } from './dialogo-confirmacion';

describe('DialogoConfirmacion', () => {
  let dialogos: MatDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }],
    });
    dialogos = TestBed.inject(MatDialog);
  });

  async function esperar(): Promise<void> {
    TestBed.tick();
    await new Promise((resolver) => setTimeout(resolver));
    TestBed.tick();
  }

  async function abrir(): Promise<boolean[]> {
    const resultados: boolean[] = [];
    confirmar(dialogos, { titulo: '¿Seguro que quieres cerrar sesión?', confirmar: 'Cerrar sesión' }).subscribe(
      (resultado) => resultados.push(resultado),
    );
    await esperar();
    return resultados;
  }

  function contenedor(): HTMLElement | null {
    return document.querySelector('mat-dialog-container');
  }

  function boton(texto: string): HTMLButtonElement {
    const botones = Array.from(document.querySelectorAll<HTMLButtonElement>('mat-dialog-container button'));
    return botones.find((candidato) => candidato.textContent?.trim() === texto) as HTMLButtonElement;
  }

  function teclaEscape(): void {
    const evento = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    Object.defineProperty(evento, 'keyCode', { value: 27 });
    document.body.dispatchEvent(evento);
  }

  it('es un diálogo de alerta con título y foco atrapado', async () => {
    await abrir();

    const titulo = contenedor()?.querySelector('h2');
    expect(titulo?.textContent).toBe('¿Seguro que quieres cerrar sesión?');
    expect(contenedor()?.getAttribute('role')).toBe('alertdialog');
    expect(contenedor()?.getAttribute('aria-labelledby')).toBe(titulo?.id);
    expect(document.querySelectorAll('.cdk-focus-trap-anchor').length).toBeGreaterThanOrEqual(2);
    expect(CONFIGURACION_DIALOGO.autoFocus).toBe('first-tabbable');
  });

  it('Cancelar no confirma el cierre', async () => {
    const resultados = await abrir();

    boton('Cancelar').click();
    await esperar();

    expect(resultados).toEqual([false]);
    expect(contenedor()).toBeNull();
  });

  it('Cerrar sesión confirma el cierre', async () => {
    const resultados = await abrir();

    boton('Cerrar sesión').click();
    await esperar();

    expect(resultados).toEqual([true]);
  });

  it('Escape equivale a Cancelar', async () => {
    const resultados = await abrir();

    teclaEscape();
    await esperar();

    expect(resultados).toEqual([false]);
    expect(contenedor()).toBeNull();
  });

  it('el aviso de inactividad muestra la cuenta regresiva y sus dos opciones', async () => {
    const segundos = signal(60);
    const resultados: (boolean | undefined)[] = [];
    dialogos
      .open(DialogoInactividad, { ...CONFIGURACION_DIALOGO, ariaDescribedBy: ID_MENSAJE_INACTIVIDAD, data: segundos })
      .afterClosed()
      .subscribe((resultado) => resultados.push(resultado));
    await esperar();

    expect(contenedor()?.textContent).toContain('Tu sesión está por expirar');
    expect(contenedor()?.getAttribute('aria-describedby')).toBe(ID_MENSAJE_INACTIVIDAD);
    expect(document.getElementById(ID_MENSAJE_INACTIVIDAD)?.textContent).toContain('60');

    segundos.set(42);
    await esperar();
    expect(document.getElementById(ID_MENSAJE_INACTIVIDAD)?.textContent).toContain('42');
    expect(boton('Cerrar sesión')).toBeDefined();

    boton('Seguir conectado').click();
    await esperar();
    expect(resultados).toEqual([false]);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PaginaNoEncontrada } from './pagina-no-encontrada';

describe('PaginaNoEncontrada', () => {
  it('ofrece volver al inicio', async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaNoEncontrada],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(PaginaNoEncontrada);
    await fixture.whenStable();
    const enlace = (fixture.nativeElement as HTMLElement).querySelector('a');

    expect(enlace?.textContent).toContain('Volver al inicio');
    expect(enlace?.getAttribute('href')).toBe('/feed');
  });
});

import { TextFieldModule } from '@angular/cdk/text-field';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, Subject, switchMap } from 'rxjs';
import { mensajeDeError } from '../../../core/http/mensaje-error';
import { PersonaVista } from '../../../shared/models/kudo';
import { RolLegiblePipe } from '../../../shared/pipes/rol-legible.pipe';
import { TamanoArchivoPipe } from '../../../shared/pipes/tamano-archivo.pipe';
import { AvisosService } from '../../../shared/services/avisos.service';
import { KudoService } from '../kudo.service';
import { ACEPTAR_ARCHIVOS, MAXIMO_ADJUNTOS, validarAdjuntos } from '../validacion-adjuntos';

export const ESPERA_BUSQUEDA_MS = 300;
export const LONGITUD_MINIMA_BUSQUEDA = 2;

export function personaSeleccionada(control: AbstractControl<PersonaVista | string | null>): ValidationErrors | null {
  const valor = control.value;
  return valor !== null && typeof valor === 'object' ? null : { personaSeleccionada: true };
}

@Component({
  selector: 'app-publicar-kudo',
  imports: [
    ReactiveFormsModule,
    TextFieldModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    RolLegiblePipe,
    TamanoArchivoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './publicar-kudo.html',
  styleUrl: './publicar-kudo.scss',
})
export class PublicarKudo {
  private readonly kudos = inject(KudoService);
  private readonly router = inject(Router);
  private readonly avisos = inject(AvisosService);
  private readonly textoBusqueda = new Subject<string>();

  protected readonly aceptarArchivos = ACEPTAR_ARCHIVOS;
  protected readonly maximoAdjuntos = MAXIMO_ADJUNTOS;
  protected readonly formulario = inject(NonNullableFormBuilder).group({
    destinatario: new FormControl<PersonaVista | string | null>(null, [personaSeleccionada]),
    categoriaId: ['', Validators.required],
    contenido: ['', [Validators.required, Validators.pattern(/\S/)]],
  });
  protected readonly categorias = rxResource({ stream: () => this.kudos.categorias() });
  protected readonly sugerencias = toSignal(
    this.textoBusqueda.pipe(
      debounceTime(ESPERA_BUSQUEDA_MS),
      map((texto) => texto.trim()),
      distinctUntilChanged(),
      switchMap((texto) =>
        texto.length < LONGITUD_MINIMA_BUSQUEDA
          ? of<PersonaVista[]>([])
          : this.kudos.buscarUsuarios(texto).pipe(catchError(() => of<PersonaVista[]>([]))),
      ),
    ),
    { initialValue: [] as PersonaVista[] },
  );
  protected readonly adjuntos = signal<readonly File[]>([]);
  protected readonly erroresAdjuntos = signal<readonly string[]>([]);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected buscarPersonas(texto: string): void {
    this.textoBusqueda.next(texto);
  }

  protected mostrarPersona(persona: PersonaVista | string | null): string {
    return typeof persona === 'string' ? persona : (persona?.nombreCompleto ?? '');
  }

  protected alSeleccionarArchivos(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    this.agregarArchivos(Array.from(entrada.files ?? []));
    entrada.value = '';
  }

  protected agregarArchivos(archivos: readonly File[]): void {
    const resultado = validarAdjuntos(this.adjuntos(), archivos);
    this.adjuntos.set(resultado.aceptados);
    this.erroresAdjuntos.set(resultado.errores);
  }

  protected quitarArchivo(indice: number): void {
    this.adjuntos.update((actuales) => actuales.filter((_, posicion) => posicion !== indice));
    this.erroresAdjuntos.set([]);
  }

  protected publicar(): void {
    if (this.formulario.invalid || this.enviando()) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { destinatario, categoriaId, contenido } = this.formulario.getRawValue();
    if (destinatario === null || typeof destinatario === 'string') {
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.kudos.publicar({ destinatarioId: destinatario.id, categoriaId, contenido }, this.adjuntos()).subscribe({
      next: (publicado) => {
        this.enviando.set(false);
        this.avisos.mostrar(`¡Kudo publicado para ${destinatario.nombreCompleto}!`);
        void this.router.navigate(['/kudos', publicado.id]);
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.error.set(mensajeDeError(error));
      },
    });
  }
}

import { TextFieldModule } from '@angular/cdk/text-field';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { mensajeDeError } from '../../../core/http/mensaje-error';
import { ReplicaPublicada } from '../../../shared/models/interaccion';
import { AvisosService } from '../../../shared/services/avisos.service';
import { InteraccionesService } from '../interacciones.service';

@Component({
  selector: 'app-formulario-replica',
  imports: [ReactiveFormsModule, TextFieldModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="formulario" (ngSubmit)="enviar()" novalidate>
      <mat-form-field appearance="outline">
        <mat-label>{{ etiqueta() }}</mat-label>
        <textarea matInput formControlName="contenido" cdkTextareaAutosize cdkAutosizeMinRows="2"></textarea>
        @if (formulario.controls.contenido.invalid) {
          <mat-error>Escribe tu réplica</mat-error>
        }
      </mat-form-field>
      @if (error(); as mensaje) {
        <p class="error" role="alert">{{ mensaje }}</p>
      }
      <button mat-flat-button type="submit" [disabled]="enviando()">{{ enviando() ? 'Publicando…' : 'Publicar' }}</button>
    </form>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    mat-form-field {
      width: 100%;
    }
    button {
      min-height: 48px;
    }
    .error {
      align-self: stretch;
      margin: 0 0 8px;
      color: var(--mat-sys-error);
    }
  `,
})
export class FormularioReplica {
  private readonly interacciones = inject(InteraccionesService);
  private readonly avisos = inject(AvisosService);

  readonly kudoId = input.required<string>();
  readonly padreId = input<string | null>(null);
  readonly etiqueta = input('Escribe una réplica');
  readonly publicada = output<ReplicaPublicada>();

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    contenido: ['', [Validators.required, Validators.pattern(/\S/)]],
  });
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected enviar(): void {
    if (this.formulario.invalid || this.enviando()) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.interacciones
      .publicarReplica(this.kudoId(), this.formulario.getRawValue().contenido.trim(), this.padreId())
      .subscribe({
        next: (replica) => {
          this.enviando.set(false);
          this.formulario.reset();
          this.publicada.emit(replica);
          this.avisos.mostrar('Réplica publicada');
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          this.error.set(mensajeDeError(error));
        },
      });
  }
}

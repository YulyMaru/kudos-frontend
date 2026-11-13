import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, firstValueFrom, map, Observable, shareReplay, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SesionRespuesta, UsuarioActual } from '../../shared/models/sesion';
import { AvisosService } from '../../shared/services/avisos.service';

export const CLAVE_TOKEN_REFRESCO = 'uco-kudos.tokenRefresco';
export const RUTA_INICIAR_SESION = '/iniciar-sesion';
export const MENSAJE_SESION_CERRADA = 'Sesión cerrada';

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly avisos = inject(AvisosService);
  private readonly urlAutenticacion = `${environment.apiUrl}/api/v1/auth`;
  private readonly tokenAccesoActual = signal<string | null>(null);
  private readonly usuarioActual = signal<UsuarioActual | null>(null);
  private refrescoEnCurso: Observable<string> | null = null;

  readonly tokenAcceso = this.tokenAccesoActual.asReadonly();
  readonly usuario = this.usuarioActual.asReadonly();
  readonly autenticado = computed(() => this.tokenAccesoActual() !== null);

  iniciarSesion(correo: string, contrasena: string): Observable<UsuarioActual> {
    return this.http
      .post<SesionRespuesta>(`${this.urlAutenticacion}/iniciar-sesion`, { correo, contrasena })
      .pipe(map((respuesta) => this.aplicar(respuesta)));
  }

  refrescar(): Observable<string> {
    const tokenRefresco = localStorage.getItem(CLAVE_TOKEN_REFRESCO);
    if (tokenRefresco === null) {
      return throwError(() => new Error('No hay una sesión para refrescar'));
    }
    this.refrescoEnCurso ??= this.http
      .post<SesionRespuesta>(`${this.urlAutenticacion}/refrescar`, { tokenRefresco })
      .pipe(
        map((respuesta) => {
          this.aplicar(respuesta);
          return respuesta.tokenAcceso;
        }),
        catchError((error: unknown) => {
          this.limpiar();
          return throwError(() => error);
        }),
        finalize(() => {
          this.refrescoEnCurso = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.refrescoEnCurso;
  }

  async restaurar(): Promise<void> {
    if (localStorage.getItem(CLAVE_TOKEN_REFRESCO) === null) {
      return;
    }
    try {
      await firstValueFrom(this.refrescar());
    } catch {
      this.limpiar();
    }
  }

  cerrarSesion(aviso = MENSAJE_SESION_CERRADA): void {
    const tokenRefresco = localStorage.getItem(CLAVE_TOKEN_REFRESCO);
    this.limpiar();
    if (tokenRefresco !== null) {
      this.http.post<void>(`${this.urlAutenticacion}/cerrar-sesion`, { tokenRefresco }).subscribe({ error: () => undefined });
    }
    void this.router.navigateByUrl(RUTA_INICIAR_SESION);
    this.avisos.mostrar(aviso);
  }

  finalizarPorExpiracion(): void {
    this.limpiar();
    void this.router.navigateByUrl(RUTA_INICIAR_SESION);
  }

  private aplicar(respuesta: SesionRespuesta): UsuarioActual {
    localStorage.setItem(CLAVE_TOKEN_REFRESCO, respuesta.tokenRefresco);
    const usuario: UsuarioActual = {
      id: respuesta.usuarioId,
      nombreCompleto: respuesta.nombreCompleto,
      rol: respuesta.rol,
    };
    this.usuarioActual.set(usuario);
    this.tokenAccesoActual.set(respuesta.tokenAcceso);
    return usuario;
  }

  private limpiar(): void {
    localStorage.removeItem(CLAVE_TOKEN_REFRESCO);
    this.tokenAccesoActual.set(null);
    this.usuarioActual.set(null);
  }
}

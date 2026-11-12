import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CanalVerificacion, FacultadVista, MensajeRespuesta, ProgramaVista, SolicitudRegistro } from '../../shared/models/registro';

@Injectable({ providedIn: 'root' })
export class CuentaService {
  private readonly http = inject(HttpClient);
  private readonly urlApi = `${environment.apiUrl}/api/v1`;

  facultades(): Observable<FacultadVista[]> {
    return this.http.get<FacultadVista[]>(`${this.urlApi}/catalogo/facultades`);
  }

  programas(facultadId: string): Observable<ProgramaVista[]> {
    return this.http.get<ProgramaVista[]>(`${this.urlApi}/catalogo/facultades/${encodeURIComponent(facultadId)}/programas`);
  }

  registrar(solicitud: SolicitudRegistro): Observable<MensajeRespuesta> {
    return this.http.post<MensajeRespuesta>(`${this.urlApi}/registro`, solicitud);
  }

  verificar(correo: string, canal: CanalVerificacion, codigo: string): Observable<MensajeRespuesta> {
    return this.http.post<MensajeRespuesta>(`${this.urlApi}/registro/verificar`, { correo, canal, codigo });
  }

  reenviarCodigo(correo: string, canal: CanalVerificacion): Observable<MensajeRespuesta> {
    return this.http.post<MensajeRespuesta>(`${this.urlApi}/registro/reenviar-codigo`, { correo, canal });
  }

  solicitarRestablecimiento(correo: string): Observable<MensajeRespuesta> {
    return this.http.post<MensajeRespuesta>(`${this.urlApi}/auth/restablecer/solicitar`, { correo });
  }

  confirmarRestablecimiento(token: string, nuevaContrasena: string): Observable<MensajeRespuesta> {
    return this.http.post<MensajeRespuesta>(`${this.urlApi}/auth/restablecer/confirmar`, { token, nuevaContrasena });
  }
}

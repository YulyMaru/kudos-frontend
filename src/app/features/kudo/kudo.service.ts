import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CategoriaVista,
  EnlaceAdjunto,
  KudoDetalleVista,
  KudoPublicadoRespuesta,
  NuevoKudo,
  PersonaVista,
} from '../../shared/models/kudo';

export const LIMITE_SUGERENCIAS = 8;

@Injectable({ providedIn: 'root' })
export class KudoService {
  private readonly http = inject(HttpClient);
  private readonly urlApi = `${environment.apiUrl}/api/v1`;
  private readonly urlKudos = `${this.urlApi}/kudos`;

  detalle(id: string): Observable<KudoDetalleVista> {
    return this.http.get<KudoDetalleVista>(`${this.urlKudos}/${encodeURIComponent(id)}`);
  }

  enlaceAdjunto(kudoId: string, adjuntoId: string): Observable<EnlaceAdjunto> {
    return this.http.get<EnlaceAdjunto>(
      `${this.urlKudos}/${encodeURIComponent(kudoId)}/adjuntos/${encodeURIComponent(adjuntoId)}/enlace`,
    );
  }

  categorias(): Observable<CategoriaVista[]> {
    return this.http.get<CategoriaVista[]>(`${this.urlApi}/categorias`);
  }

  buscarUsuarios(texto: string): Observable<PersonaVista[]> {
    const parametros = new HttpParams().set('busqueda', texto).set('limite', LIMITE_SUGERENCIAS);
    return this.http.get<PersonaVista[]>(`${this.urlApi}/usuarios`, { params: parametros });
  }

  publicar(kudo: NuevoKudo, adjuntos: readonly File[]): Observable<KudoPublicadoRespuesta> {
    if (adjuntos.length === 0) {
      return this.http.post<KudoPublicadoRespuesta>(this.urlKudos, kudo);
    }
    const formulario = new FormData();
    formulario.append('destinatarioId', kudo.destinatarioId);
    formulario.append('categoriaId', kudo.categoriaId);
    formulario.append('contenido', kudo.contenido);
    for (const archivo of adjuntos) {
      formulario.append('adjuntos', archivo, archivo.name);
    }
    return this.http.post<KudoPublicadoRespuesta>(this.urlKudos, formulario);
  }
}

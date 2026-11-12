import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginaReplicas, ReplicaPublicada, ResumenCalificacion, TipoContenido } from '../../shared/models/interaccion';

export const TAMANO_PAGINA_REPLICAS = 20;

@Injectable({ providedIn: 'root' })
export class InteraccionesService {
  private readonly http = inject(HttpClient);
  private readonly urlApi = `${environment.apiUrl}/api/v1`;

  replicas(kudoId: string, padre: string | null, cursor: string | null): Observable<PaginaReplicas> {
    let parametros = new HttpParams().set('limite', TAMANO_PAGINA_REPLICAS);
    if (padre !== null) {
      parametros = parametros.set('padre', padre);
    }
    if (cursor !== null) {
      parametros = parametros.set('cursor', cursor);
    }
    return this.http.get<PaginaReplicas>(this.urlReplicas(kudoId), { params: parametros });
  }

  publicarReplica(kudoId: string, contenido: string, replicaPadreId: string | null): Observable<ReplicaPublicada> {
    return this.http.post<ReplicaPublicada>(this.urlReplicas(kudoId), { contenido, replicaPadreId });
  }

  calificar(tipoContenido: TipoContenido, contenidoId: string, valor: number): Observable<ResumenCalificacion> {
    return this.http.put<ResumenCalificacion>(`${this.urlApi}/calificaciones`, { tipoContenido, contenidoId, valor });
  }

  reportar(tipoContenido: TipoContenido, contenidoId: string, motivo: string): Observable<void> {
    return this.http.post<void>(`${this.urlApi}/reportes`, { tipoContenido, contenidoId, motivo });
  }

  private urlReplicas(kudoId: string): string {
    return `${this.urlApi}/kudos/${encodeURIComponent(kudoId)}/replicas`;
  }
}

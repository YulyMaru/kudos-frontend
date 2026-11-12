import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginaFeed } from '../../shared/models/kudo';

export const TAMANO_PAGINA_FEED = 10;

@Injectable({ providedIn: 'root' })
export class FeedService {
  private readonly http = inject(HttpClient);

  pagina(cursor: string | null): Observable<PaginaFeed> {
    let parametros = new HttpParams().set('limite', TAMANO_PAGINA_FEED);
    if (cursor !== null) {
      parametros = parametros.set('cursor', cursor);
    }
    return this.http.get<PaginaFeed>(`${environment.apiUrl}/api/v1/kudos`, { params: parametros });
  }
}

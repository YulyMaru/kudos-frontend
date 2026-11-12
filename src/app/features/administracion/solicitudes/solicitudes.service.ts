import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SolicitudPendiente } from '../../../shared/models/solicitud';

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private readonly http = inject(HttpClient);
  private readonly urlSolicitudes = `${environment.apiUrl}/api/v1/solicitudes`;

  listar(): Observable<SolicitudPendiente[]> {
    return this.http.get<SolicitudPendiente[]>(this.urlSolicitudes);
  }

  aprobar(id: string): Observable<void> {
    return this.http.post<void>(`${this.urlSolicitudes}/${encodeURIComponent(id)}/aprobar`, null);
  }

  rechazar(id: string, motivo: string): Observable<void> {
    return this.http.post<void>(`${this.urlSolicitudes}/${encodeURIComponent(id)}/rechazar`, { motivo });
  }
}

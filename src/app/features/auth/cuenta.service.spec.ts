import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { SolicitudRegistro } from '../../shared/models/registro';
import { CuentaService } from './cuenta.service';

describe('CuentaService', () => {
  const api = `${environment.apiUrl}/api/v1`;
  let servicio: CuentaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(CuentaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta el catálogo de facultades y programas', () => {
    let facultades: unknown;
    let programas: unknown;
    servicio.facultades().subscribe((respuesta) => (facultades = respuesta));
    servicio.programas('f 1').subscribe((respuesta) => (programas = respuesta));

    const peticionFacultades = http.expectOne(`${api}/catalogo/facultades`);
    const peticionProgramas = http.expectOne(`${api}/catalogo/facultades/f%201/programas`);
    expect(peticionFacultades.request.method).toBe('GET');
    expect(peticionProgramas.request.method).toBe('GET');
    peticionFacultades.flush([{ id: 'f 1', nombre: 'Ingeniería' }]);
    peticionProgramas.flush([{ id: 'p1', nombre: 'Sistemas' }]);
    expect(facultades).toEqual([{ id: 'f 1', nombre: 'Ingeniería' }]);
    expect(programas).toEqual([{ id: 'p1', nombre: 'Sistemas' }]);
  });

  it('envía la solicitud de registro', () => {
    const solicitud: SolicitudRegistro = {
      nombreCompleto: 'Ana Pérez',
      correo: 'ana@uco.edu.co',
      celular: '+573001234567',
      rol: 'ESTUDIANTE',
      facultadId: null,
      programaId: 'p1',
      contrasena: 'una-clave-larga',
      aceptaPolitica: true,
    };

    servicio.registrar(solicitud).subscribe();

    const peticion = http.expectOne(`${api}/registro`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(solicitud);
    peticion.flush({ mensaje: 'ok' });
  });

  it('verifica y reenvía códigos por canal', () => {
    servicio.verificar('ana@uco.edu.co', 'CELULAR', '123456').subscribe();
    servicio.reenviarCodigo('ana@uco.edu.co', 'CORREO').subscribe();

    expect(http.expectOne(`${api}/registro/verificar`).request.body).toEqual({
      correo: 'ana@uco.edu.co',
      canal: 'CELULAR',
      codigo: '123456',
    });
    expect(http.expectOne(`${api}/registro/reenviar-codigo`).request.body).toEqual({
      correo: 'ana@uco.edu.co',
      canal: 'CORREO',
    });
  });

  it('solicita y confirma el restablecimiento de contraseña', () => {
    servicio.solicitarRestablecimiento('ana@uco.edu.co').subscribe();
    servicio.confirmarRestablecimiento('tk', 'nueva-clave-larga').subscribe();

    expect(http.expectOne(`${api}/auth/restablecer/solicitar`).request.body).toEqual({ correo: 'ana@uco.edu.co' });
    expect(http.expectOne(`${api}/auth/restablecer/confirmar`).request.body).toEqual({
      token: 'tk',
      nuevaContrasena: 'nueva-clave-larga',
    });
  });
});

import { Page, Route } from '@playwright/test';

const API = 'http://localhost:8080/api/v1';

export const ANA = { id: 'u-ana', nombreCompleto: 'Ana Docente', rol: 'DOCENTE' } as const;
export const LUIS = { id: 'u-luis', nombreCompleto: 'Luis Estudiante', rol: 'ESTUDIANTE' } as const;
export const LIDERAZGO = { id: 'c-liderazgo', nombre: 'Liderazgo' } as const;

interface KudoSimulado {
  readonly id: string;
  readonly contenido: string;
  readonly fechaPublicacion: string;
}

function sesion() {
  const ahora = Date.now();
  return {
    tokenAcceso: 'token-acceso',
    tipoToken: 'Bearer',
    expiraEn: new Date(ahora + 900_000).toISOString(),
    tokenRefresco: 'token-refresco',
    expiraRefrescoEn: new Date(ahora + 604_800_000).toISOString(),
    usuarioId: ANA.id,
    nombreCompleto: ANA.nombreCompleto,
    rol: ANA.rol,
  };
}

function resumen(kudo: KudoSimulado) {
  return {
    id: kudo.id,
    autor: ANA,
    destinatario: LUIS,
    categoria: LIDERAZGO,
    extracto: kudo.contenido,
    contenidoTruncado: false,
    fechaPublicacion: kudo.fechaPublicacion,
    cantidadAdjuntos: 0,
    cantidadReplicas: 0,
    promedioCalificacion: 0,
    cantidadCalificaciones: 0,
  };
}

function detalle(kudo: KudoSimulado) {
  return {
    id: kudo.id,
    autor: ANA,
    destinatario: LUIS,
    categoria: LIDERAZGO,
    contenido: kudo.contenido,
    fechaPublicacion: kudo.fechaPublicacion,
    adjuntos: [],
    cantidadReplicas: 0,
    promedioCalificacion: 0,
    cantidadCalificaciones: 0,
  };
}

export async function simularApi(pagina: Page): Promise<void> {
  const kudos: KudoSimulado[] = [];
  const responder = (ruta: Route, cuerpo: unknown, estado = 200) =>
    ruta.fulfill({ status: estado, contentType: 'application/json', body: JSON.stringify(cuerpo) });

  await pagina.routeWebSocket('ws://localhost:8080/ws', () => undefined);
  await pagina.route(`${API}/auth/iniciar-sesion`, (ruta) => responder(ruta, sesion()));
  await pagina.route(`${API}/auth/cerrar-sesion`, (ruta) => ruta.fulfill({ status: 204 }));
  await pagina.route(`${API}/categorias`, (ruta) => responder(ruta, [LIDERAZGO]));
  await pagina.route(`${API}/usuarios?*`, (ruta) => responder(ruta, [LUIS]));
  await pagina.route(`${API}/kudos?*`, (ruta) =>
    responder(ruta, { kudos: [...kudos].reverse().map(resumen), siguienteCursor: null }),
  );
  await pagina.route(`${API}/kudos`, (ruta) => {
    const cuerpo = ruta.request().postDataJSON() as { contenido: string };
    const kudo = { id: `k-${kudos.length + 1}`, contenido: cuerpo.contenido, fechaPublicacion: new Date().toISOString() };
    kudos.push(kudo);
    return responder(ruta, { id: kudo.id, fechaPublicacion: kudo.fechaPublicacion }, 201);
  });
  await pagina.route(`${API}/kudos/*`, (ruta) => {
    const id = new URL(ruta.request().url()).pathname.split('/').pop();
    const kudo = kudos.find((k) => k.id === id);
    return kudo ? responder(ruta, detalle(kudo)) : responder(ruta, { title: 'No encontrado', status: 404, detail: 'El Kudo no existe' }, 404);
  });
}

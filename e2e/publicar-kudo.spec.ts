import { expect, test } from '@playwright/test';
import { LUIS, simularApi } from './api-simulada';

test('iniciar sesión, publicar un Kudo y verlo en el feed', async ({ page }) => {
  const motivo = 'Gracias por liderar el semillero de investigación con tanta dedicación.';
  await simularApi(page);

  await page.goto('/');
  await expect(page).toHaveURL(/\/iniciar-sesion/);
  await page.getByLabel('Correo institucional').fill('ana.docente@uco.edu.co');
  await page.getByLabel('Contraseña', { exact: true }).fill('Clave-Segura-123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(page).toHaveURL(/\/feed/);
  await expect(page.getByText('Aún no hay Kudos')).toBeVisible();

  await page.getByRole('link', { name: 'Dar Kudo' }).click();
  await expect(page.getByRole('heading', { name: 'Dar un Kudo' })).toBeVisible();
  await page.getByLabel('¿A quién quieres reconocer?').fill('Luis');
  await page.getByRole('option', { name: new RegExp(LUIS.nombreCompleto) }).click();
  await page.getByLabel('Categoría').click();
  await page.getByRole('option', { name: 'Liderazgo' }).click();
  await page.getByLabel('Cuéntale a la comunidad por qué lo reconoces').fill(motivo);
  await page.getByRole('button', { name: 'Publicar Kudo' }).click();

  await expect(page).toHaveURL(/\/kudos\/k-1$/);
  await expect(page.getByRole('heading', { name: 'Ana Docente reconoció a Luis Estudiante' })).toBeVisible();
  await expect(page.getByText(motivo)).toBeVisible();

  await page.getByRole('link', { name: 'Volver al inicio' }).click();
  await expect(page).toHaveURL(/\/feed/);
  await expect(page.getByText(motivo)).toBeVisible();
});

/**
 * R-04 · Alta de persona sin red (TRL 5.16 / 6.26).
 * No debe perderse el formulario ni acabar en chrome-error://.
 *
 * Requiere: npx playwright install && npm run test:e2e
 * (puede apuntar a un staging con EXPERT_E2E_* o correr con mocks).
 */
import { test, expect } from "@playwright/test";

test.describe("R-04 alta sin red", () => {
  test("sin red: no navega a chrome-error y conserva el formulario", async ({
    page,
    context,
  }) => {
    // Mock de sesión experto + APIs (sin backend real).
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          user: {
            id: "exp-e2e",
            name: "Experto E2E",
            role: "Experto",
            roleId: "experto",
            terr: "Salento",
            href: "/experto",
            nk: "exp-e2e",
          },
        }),
      });
    });
    await page.route("**/api/app-state", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, slices: {} }),
      });
    });
    await page.route("**/api/people**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true, people: [], total: 0 }),
        });
        return;
      }
      await route.abort("failed");
    });
    await page.route("**/api/worklists**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true, items: [] }),
        });
        return;
      }
      await route.abort("failed");
    });
    await page.route("**/api/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/experto");
    await page.getByRole("button", { name: /Nueva persona|\+ Nueva/i }).click();
    await page.getByLabel(/Nombre/i).first().fill("Ana");
    await page.getByLabel(/Apellido/i).first().fill("Prueba");
    // Fecha de nacimiento (18–110).
    const birth = page.locator('input[type="date"]').first();
    if (await birth.count()) await birth.fill("1990-05-15");
    await page.getByLabel(/Vereda|barrio/i).first().fill("Vereda Cocora");

    await context.setOffline(true);

    await page.getByRole("button", { name: /Guardar|Continuar|Evaluar/i }).click();

    await expect(page).not.toHaveURL(/chrome-error:/);
    // Formulario sigue visible (mensaje offline o campos).
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/conexión|siguen aquí|sin señal|formulario|Ana/i);
    expect(page.url()).not.toMatch(/chrome-error/);
  });
});

# Curación clínica de porciones (ingredientes)

La app usa **una porción = `portionGramEquivalent` gramos** por ingrediente. Esos valores viven en:

- `src/data/ingredientPortionOverrides.json` (fuente explícita; sincronizar con el catálogo)
- `src/data/ingredientReference.json` (campo `portionGramEquivalent` en cada ítem, generado por script)

## Flujo recomendado

1. Editar equivalencias clínicas en `ingredientPortionOverrides.json` (o ajustar reglas en `ingredientPortionRules.js` si aún aplica inferencia).
2. Regenerar el catálogo con porciones materializadas:

   ```bash
   npm run reference:portion-equivalents
   ```

3. Sincronizar overrides con el catálogo (cobertura 1:1):

   ```bash
   npm run reference:portion-overrides:sync
   npm run reference:portion-equivalents
   ```

4. Validar en CI / local:

   ```bash
   npm run reference:portion-report:strict
   ```

5. Revisión nutricional asistida (outliers vs grupo o vs peso por pieza):

   ```bash
   node scripts/report-portion-curation-review.js
   ```

6. Humanización en UI (pasos redondeados, hints): editar `src/data/ingredientHumanPortionProfiles.json` y desplegar; el frontend toma `humanPortionProfiles` del mismo endpoint que la referencia.

7. Actualizar el bundle offline del frontend (repos hermanos `mi-dieta-api` y `mi-dieta`):

   ```bash
   npm run reference:export-frontend-bundle
   ```

   Desde la raíz de `mi-dieta` (misma condición de carpetas hermanas):

   ```bash
   npm run sync:ingredient-reference-bundle
   ```

## Cambio de ingrediente en el plan (`PUT /plans/my/ingredient`)

Al elegir otro ingrediente del **mismo grupo**, el backend recalcula `cantidad` en **gramos** para conservar el mismo número de **porciones de intercambio** (`gramos / portionGramEquivalent` del viejo × `portionGramEquivalent` del nuevo).

## Humanización (`humanPortionProfiles`)

Cada perfil define `defaultUnit`, pasos permitidos y límites. Los `aliases` deben cubrir variantes de nombre que aparezcan en recetas. Tras cambios, vuelve a exportar el bundle del paso 7.

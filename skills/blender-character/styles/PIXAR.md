# Style: Pixar / Disney / DreamWorks feature animation

The target is a *creature*, not a *toy*. Pixar renders toys (Rex) as uniformly
glossy moulded plastic on purpose; the moment a creature reads that way the
user will say "plastic". Collect 1–3 reference images before building and
match their shape language, not their character (studio characters are
trademarked — make an original in the style).

## Shapes

- One continuous organic surface (MODELING.md § metaballs); no visible seams.
- Big head and very big, iris-dominant eyes set in sculpted sockets under brow
  ridges; brows carry most of the expression.
- S-curved neck, soft big volumes (haunches, belly), tapered limbs with clear
  joints; hands and feet with distinct rounded digits.
- Exaggerate age, weight and personality through proportion and accessories
  that read at a glance (white bushy brows, under-eye bags, wrinkles); drop any
  detail that reads as something else (pointed white tufts under the mouth =
  fangs).

## Skin

- Principled BSDF: roughness ≈ 0.55–0.6, Specular IOR Level ≈ 0.3, no coat,
  Sheen ≈ 0.15–0.35 (velvet), Subsurface ≈ 0.25–0.4 with a red-heavy radius
  (1.0, 0.42, 0.22) and small scale — warm light through thin areas.
- Painterly colour, never one flat hue: darker along the back (normal-facing-up
  mask), soft low-frequency variation, a few soft spots, a lighter belly and
  throat with a wide transition; slightly desaturated mid-tones (AgX
  desaturates, so start richer than you think).
- Micro detail as faint, large-scale bump only (strength ≈ 0.1); strong fine
  scales read as vinyl.
- Mouth interior and tongue: wet, SSS, darkening with depth (FACE.md).

## Eyes

Glossy coat; iris as a radial gradient (warm outer ring → lighter/greener
centre) with fibre noise and a dark limbal ring; large dark pupil; a painted
glint. Big irises, small visible sclera, calm open lids.

## Light and render

- Soft warm key area light (large size), cool fill, strong warm rim; warm
  studio cyclorama backdrop (avoid seeing its edges).
- Colour management AgX with "Medium High Contrast", exposure ≈ −0.3; "Punchy"
  over-saturates skin.
- EEVEE with ray tracing off for stylized glossy eyes; motion blur on for
  animation.

## Acting

Readable, restrained: eyes lead, head follows, brows and lids carry thought;
event-driven blinks and saccades (FACE.md). Heavy lids read drunk; wide static
eyes read startled; perfectly locked eyes read dead.

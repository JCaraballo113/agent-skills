# Stylized cartoon creature mouth in Blender 5.x: modelling, shading, rigging, lip sync

Research date: 2026-09-25. Target: the script-generated "wise old gecko" (metaball body, voxel-remeshed, then decimated; boolean-carved mouth; one jaw bone; RMS-driven jaw).

**Legend**
- Every factual claim has an inline link to where it was checked.
- **JUDGEMENT** marks a recommendation I derived from the sources, the reference images or the renders. No source states it directly.
- **UNVERIFIED** marks a claim I could not confirm from a primary source during this research.
- Blender manual pages are cited at `docs.blender.org/manual/en/latest/...`. They were read from the 5.1 manual that ships with the Blender MCP server. The versions page lists 5.1 as the newest: <https://docs.blender.org/manual/en/latest/versions.html>. Rigify moved out of the core manual, and the `latest` Rigify URL returns 404, so the Rigify pages are cited from the 4.2 manual.

---

## 0. Diagnosis of the current renders (evidence first)

What I saw in `renders/mouth_test2.png`, `mouth_test3.png`, `mouth_test4.png` and the underside screenshot (`~/Desktop/Screenshot 2026-09-25 at 12.46.44 AM.png`):

| Symptom | Likely cause (JUDGEMENT) | Where it is addressed |
|---|---|---|
| The open mouth reads as a "slot with a rubber rim". A saturated red band runs all the way round the opening. | The lip edge is a flat boolean wall carrying the *interior* material. In both references the lip roll is **body-coloured**: black on Toothless, blue on the Bruni-style lizard. Pink starts only *inside* the lip. The cavity is also a thin 3.5 mm wedge, so the only thing visible when the mouth opens is its walls. | §2, §7 P1 |
| Streaks and "teeth-like" stripes on the inner walls (`mouth_test3`). | Long sliver triangles from Decimate on the stretched boolean wall. The manual says Collapse decimation keeps triangulated output ([Decimate](https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/decimate.html)). | §1.2, §7 P1 |
| The tongue looks small and pasted on (a heart shape poking out). | It is a separate small ellipsoid that neither fills the mouth floor nor connects to it. In the Toothless reference the tongue is broad and fills the whole lower jaw. | §3 |
| From below: a hard vertical crease behind the jaw, and the mouth splits along the sides like a clamshell. | A step cutoff in the jaw weights, plus a mouth *opening* that wraps ±78° round the head. | §4.6, §4.7 |
| Jagged sawtooth throat wrinkles. | Boolean grooves narrower than the mesh resolution, then decimated. | §4.8 |

---

## 1. Topology

### 1.1 What production mouth topology looks like

- **Concentric loops, continued inside.** Autodesk's Softimage guide says: "Use smooth, highly detailed loops on the corners … Use quads as much as possible and have the flow lines of the corner be as clean as possible", and "Carry your flow lines into the mouth interior for best results." For the inner lip it suggests you "duplicate the last edge of the lips and pull them back slightly … and then continue this process" ([Softimage User Guide: Modeling the Mouth Area](https://download.autodesk.com/global/docs/softimage2014/en_us/userguide/files/face_modeling_ModelingtheMouthArea.htm)).
- **The mouth corner is the critical point.** The same guide: "Where you place the tip of this corner section is the most critical decision", the corner line should be "as close as possible to a horizontal plane", and good placement means "the mouth corner can spread apart properly as it opens, and not create a fused sticky mass" ([Softimage guide](https://download.autodesk.com/global/docs/softimage2014/en_us/userguide/files/face_modeling_ModelingtheMouthArea.htm)).
- **Lip-inner-edge contour and the nasolabial loop.** Reallusion's topology guide defines a "Lip Inner Edge" loop: vertices at "the contour at which the upper and lower lip curves drop away to the inside of the mouth". It asks that the "Nasolabial fold flows naturally from the wings of the nose to the sides of the mouth". It also warns that "The corners of the mouth has a tendency to intersect. Uneven mesh distribution will cause this area to distort" ([Reallusion CC Face Topology Guide](https://wiki.reallusion.com/Content_Dev:CC_Face_Topology_Guide)).
- **The mouth interior supports the lip.** "The mouth interior should be modeled so that the inside of the lip is present and supports outward lip curling" ([Softimage guide](https://download.autodesk.com/global/docs/softimage2014/en_us/userguide/files/face_modeling_ModelingtheMouthArea.htm)). Blender Studio's *Stylized Character Workflow* has a dedicated lesson on modelling the inner mouth objects "with just enough definition and detail to support the expression tests" ([Blender Studio lesson](https://studio.blender.org/training/stylized-character-workflow/5dc4235ef7f24231f6f62cae/)).
- **The rig mirrors the loops.** Rigify's face rig expects "one or more child chain loops, each formed by four skin chains tagged with .T/.B and .L/.R". It sorts lip loops "into layers based on the distance from corners to the common center", and blends each layer between jaw and mouth control ([Rigify Face rig types, 4.2 manual](https://docs.blender.org/manual/en/4.2/addons/rigging/rigify/rig_types/face.html)).

### 1.2 Why our mesh cannot simply have that, and what Blender itself says

- The Blender manual says the voxel remesher "should *not* be used for … Creating topology for a mesh that will be deformed (e.g. a character that will be animated). Such topology has to follow the flow of the geometry, and no perfect automatic tools exist for this right now; it has to be done manually." It says the same of the Quad (QuadriFlow) remesher ([Remeshing](https://docs.blender.org/manual/en/latest/modeling/meshes/retopology.html)).
- The voxel remesher builds "a virtual 3D grid" and outputs a surface with "no inner (self-intersecting) geometry" ([Remeshing](https://docs.blender.org/manual/en/latest/modeling/meshes/retopology.html)). **JUDGEMENT:** so any gap narrower than about 2 voxels (about 13 mm at our 0.0065 voxel size) fuses shut. That is why the 3.5 mm slot has to be cut *after* remeshing, and it is the root of the sliver problem.
- Decimate's Collapse mode keeps triangulated output, and it takes a **Vertex Group** plus **Factor** that "controls what parts of the mesh are decimated" ([Decimate](https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/decimate.html); API `DecimateModifier.vertex_group`, `.vertex_group_factor`: <https://docs.blender.org/api/current/bpy.types.DecimateModifier.html>).

### 1.3 How productions get topology-independent facial deformation

- **Pixar, Inside Out 2 (2024):** "curvenet and Profile Mover … allow us to deform our subdivision surfaces completely independent of shape or topology". Anxiety's mouth used "three layers of controls" for the mouth corners, "nine sections on each lip", and teeth "constrained … to follow the contours of the lips" via curves ([Pixar SIGGRAPH Talk 2024, archived PDF](https://web.archive.org/web/2024id_/https://graphics.pixar.com/library/InsideOut2Rig/paper.pdf); DOI [10.1145/3641233.3664342](https://doi.org/10.1145/3641233.3664342)).
- **Pixar, harmonic coordinates (cages):** "cage-based methods allow us to decouple the geometry being articulated (the cage) from the geometry of the character … the decoupling allows us to reuse the articulation as the character geometry changes". Influence "falls off with distance as measured within the cage" ([Joshi et al., Harmonic Coordinates for Character Articulation, Pixar TM 06-02b](https://web.archive.org/web/2024id_/https://graphics.pixar.com/library/HarmonicCoordinatesB/paper.pdf)). Blender's **Mesh Deform** modifier cites this paper as its "Original paper" ([Mesh Deform](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/mesh_deform.html)).
- **Disney (Bolt, Prep & Landing):** blendshapes are "fast, yet memory intensive and sensitive to model changes". Their hybrid rig drives geometric deformers and blendshapes through a fixed pose-space table that is the same "for every character, regardless of scale or topology" ([Komorowski et al., A Hybrid Approach to Facial Rigging, 2010](https://media.disneyanimation.com/uploads/production/publication_asset/52/asset/hybridFacialTalk.pdf)).
- **Takeaway (JUDGEMENT):** feature pipelines separate *what the deformation is* (curves, cages, parametric tables) from *which mesh receives it*. Our mesh is regenerated on every build, so vertex order changes each time. We must do the same: define every weight and shape key as a **function of position in a mouth coordinate system**, then re-evaluate it on whatever mesh the build produces.

### 1.4 Options for us

| Option | How it works in Blender | Pros | Cons for a script pipeline |
|---|---|---|---|
| **A. Analytic "lip-space" fields on the render mesh** (recommended) | For each vertex compute (u = position along the smile curve, s = signed distance above/below the lip line, d = depth into the mouth). Write jaw weights and shape-key offsets as smooth functions of (u, s, d) with `ShapeKey.points.foreach_set` / `VertexGroup.add`. | No binding step, deterministic, and smooth by construction. Survives remeshing. Same philosophy as Pixar's topology-independent deformers. | Quality is capped by the render mesh's *resolution*, not its flow. Needs dense, uniform faces around the mouth, which means no decimation there. |
| B. Procedural lip-patch proxy + **Surface Deform** | Build a clean quad patch (concentric loops) in bmesh. Rig or shape-key it. Bind the render mesh with Surface Deform, masked by a vertex group. | Clean loops, so authored shapes are easy to reason about. | The target must have no concave faces, no doubles, and no edges with more than 2 faces ([Surface Deform](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/surface_deform.html)). Binding is in world space and later object transforms are ignored. "The further a mesh deviates from the target mesh surface, the more likely … artifacts". Upper and lower lip vertices near a narrow slit can bind to the wrong half. **Mitigation:** two modifiers with **Sparse Bind** and upper/lower vertex groups. |
| C. Proxy + **Mesh Deform** cage | Closed cage around the muzzle, `meshdeform_bind` | Pixar-grade method in principle, with interior-distance falloff. | "Can be very slow to compute the binding", "possible that Blender will run out of memory", and it gives artifacts on large cage changes ([Mesh Deform](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/mesh_deform.html)). Whether a 3–10 mm lip slit is resolved at practical Precision values is **UNVERIFIED**. |
| D. **Data Transfer** from a proxy | Copy vertex-group weights or normals from a clean proxy, e.g. "Nearest Face Interpolated" ([Data Transfer](https://docs.blender.org/manual/en/latest/modeling/modifiers/modify/data_transfer.html)) | Good for *weights* | Transfers data only, not deformation. |
| E. **Shrinkwrap** | Projects vertices onto a target ([Shrinkwrap](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/shrinkwrap.html)) | Good for keeping lips on teeth or gums, or a tongue inside the bag | Not a deformation-transfer tool. Blender Studio used Shrinkwrap for "Preventing teeth clipping" on Sprite Fright ([video listing](https://studio.blender.org/projects/sprite-fright/rigging/?asset=4509); details not public, so **UNVERIFIED**). |
| F. Retopo the face with QuadriFlow | `bpy.ops.object.quadriflow_remesh(use_preserve_boundary=True, …)` ([API](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.quadriflow_remesh)) | Quads | The manual says it is not for final deforming topology ([Remeshing](https://docs.blender.org/manual/en/latest/modeling/meshes/retopology.html)). Whether it produces concentric mouth loops around an open boundary is **UNVERIFIED**. The manual's "Preserve Mesh Boundary" text is a copy of the volume text, so the doc cannot be relied on here. |
| G. Hand-join a procedural mouth patch into the voxel body | Delete faces, then `bmesh.ops.bridge_loops` | True mouth loops | Bridging arbitrary voxel boundaries to a fixed loop is fragile. Every rebuild risks non-manifold seams. |

### 1.5 Recommendation

**Use Option A (analytic lip-space fields).** Keep Option B as a later upgrade if we ever want sculpted shapes. Four reasons:

1. **The mesh is regenerated every build.** Shape keys stored per vertex are "sensitive to model changes" ([Disney 2010](https://media.disneyanimation.com/uploads/production/publication_asset/52/asset/hybridFacialTalk.pdf)). Fields in (u, s, d) are regenerated for free.
2. **There is no bind step to fail or mis-bind across the lip gap** (see the Surface Deform constraints above).
3. **Smoothness is guaranteed** by using smooth functions (smoothstep, the ellipse profile below). That directly fixes the hard jaw-weight step.
4. **Blender does the rest natively.** Shape keys are the recommended mechanism for "facial animation (e.g. mouth positions, expressions, phonemes)" ([Shape Keys intro](https://docs.blender.org/manual/en/latest/animation/shape_keys/introduction.html)). Armature plus Corrective Smooth handles the jaw ([Corrective Smooth](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/corrective_smooth.html)).

The precondition, which is **JUDGEMENT**: stop decimating the head. Either lower the voxel size until no decimation is needed, or protect the head with a Decimate vertex group at factor 1. Then add a Subdivision Surface modifier at render time.

---

## 2. Mouth bag / interior

### 2.1 Modelling

- **Continuous surface: lip, then lip roll, then bag.** Continue the lip loops into the interior ([Softimage](https://download.autodesk.com/global/docs/softimage2014/en_us/userguide/files/face_modeling_ModelingtheMouthArea.htm)). RenderMan's docs describe the production "sock-mouth where the interior and tongue may be the same surface". Their SSS "Continuation Rays" option exists for "an object that may be modeled with a void or space in the interior such as a mouth that is part of the same mesh as the face" ([RenderMan 26 SSS parameters](https://rmanwiki-26.pixar.com/space/REN26/19661417/Subsurface+Scattering+Parameters)).
- **Keep it watertight.** Blender's Random Walk SSS "works best for closed meshes. Overlapping faces and holes in the mesh can cause problems" ([Principled BSDF](https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/principled.html)). A boolean-carved bag inside the watertight voxel body satisfies this. A separate open "sack" mesh would not.
- **Shape (JUDGEMENT, from the references).** The bag should be a *volume*, not a crevice. Floor: a U-shaped trough that follows the lower jaw, with the tongue lying in it. Roof: follows the upper jaw. Back: narrows into a throat funnel that ends out of camera view. Our 3.5 mm → 38 mm wedge only shows its walls. The Toothless reference shows a broad pink floor and tongue from corner to corner.
- **Teeth and gums.** Pixar's Ratatouille notes say "Teeth heavily influence appeal … by cradling the teeth within the lips they appear smaller and more appealing" ([Konishi & Venturini, Articulating the Appeal, Pixar TM 07-12](https://web.archive.org/web/2024id_/https://graphics.pixar.com/library/ArticulatingAppeal/paper.pdf)). For a toothless cartoon gecko, **JUDGEMENT:** skip teeth, but put a slightly raised, lighter gum ridge just inside each lip so the lip has something to "sit on".

### 2.2 Shading: what stops it looking plasticky

Primary-source facts:
- **SSS.** The Principled BSDF Subsurface layer is for "skin, milk and wax". Radius is per-RGB "to render materials such as skin where red light scatters deeper". **Random Walk (Skin)** "tends to retain greater surface detail and color and matches measured skin more closely". Skin anisotropy "has been measured … 0.8" ([Principled BSDF](https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/principled.html)).
- **Wetness.** Use the **Coat** layer, which is "on top of the materials, to simulate for example a clearcoat, lacquer" with its own weight and roughness ([Principled BSDF](https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/principled.html)).
- **Occlusion.** The AO node has **Inside** and **Only Local** options. The manual says it is "expensive" in Cycles and suggests Pointiness or baked AO as cheaper alternatives ([AO node](https://docs.blender.org/manual/en/latest/render/shader_nodes/input/ao.html)).

Recommendations (**JUDGEMENT**, practice rather than sourced fact):
1. **The lip roll is skin-coloured.** Build the lip-to-interior transition as a *gradient* on the depth attribute d. The skin colour runs over the rounded lip and fades to pink 2–4 mm inside. Do not use the boolean face-material split. This is the single biggest "rubber rim" fix; see both references.
2. **Value and saturation fall with depth:** lip-inside pink → mid red → desaturated dark maroon → near-black at the throat. Multiply the Base Color by AO (Only Local) so the bag's corners and back darken.
3. **Roughness about 0.35–0.5, plus a thin Coat** (weight 0.3–0.6, coat roughness 0.08–0.2). This gives small sharp wet glints instead of one broad plastic sheen. Break both up with low-amplitude noise.
4. **SSS: Random Walk (Skin), red-dominant radius.** Keep the Scale small relative to mouth size, otherwise the whole bag glows.
5. **Micro-bump in the bag** so specular highlights crawl rather than slide.

---

## 3. Tongue

- **Anatomy (gecko).** The *Gekko japonicus* tongue shows "dome-shaped papillae at the apex, fan-shaped papillae at the corpus, and scale-like papillae at the radix" (Iwasaki 1990, Am. J. Anat., <https://onlinelibrary.wiley.com/doi/10.1002/aja.1001870103>; only the abstract was reachable, so the detail is **UNVERIFIED** beyond that). The leopard gecko foretongue carries distinct papillae used in fluid uptake (<https://link.springer.com/article/10.1007/s11692-009-9072-9>; abstract only, **UNVERIFIED** beyond that).
- **Stylized size (JUDGEMENT, from the references).** In the Toothless reference the tongue fills the whole floor of the lower jaw, corner to corner. Target:
  - width about 70–85 % of the inner lower-jaw width
  - thickness about 30–45 % of its width
  - tip sitting just behind the lower lip
  - top surface a little below the lower-lip line at rest
  - the root sinks into the bag floor, with no visible seam
- **Human proportion check (derived measurement).** In Rigify's legacy human metarig, the three tongue bones total about 0.096 m against a lip-corner-to-corner width of about 0.070 m, roughly 1.4× the mouth width. The tip sits about 3.6 cm behind the upper-lip front ([Rigify `metarigs/human.py`](https://projects.blender.org/blender/blender-addons/src/branch/main/rigify/metarigs/human.py); my arithmetic from bone head/tail coordinates).
- **Rig (Rigify `face.basic_tongue`).** It generates "a simple tongue, extracted from the original PitchiPoy super_face rig" with a B-bone segments option ([Rigify Face, 4.2 manual](https://docs.blender.org/manual/en/4.2/addons/rigging/rigify/rig_types/face.html)). In the source:
  - a minimum 3-bone chain
  - a master control at the tip
  - MCH "follow" bones that copy the master with influence `1-(1+i)/n`, so the curl is graduated along the chain
  - tweak controls on each bone
  - B-bone segments default 10

  ([basic_tongue.py](https://projects.blender.org/blender/blender-addons/src/branch/main/rigify/rigs/face/basic_tongue.py)). For us: 4 bones parented to the jaw, B-bones with 8–10 segments, a `tongue_curl` custom property driving the graduated rotations, and a `tongue_out` property driving head-bone translation or stretch.
- **Keep it inside the bag.** Put Shrinkwrap in "Inside"/"Outside" mode on the tongue against the bag surface; it gives "very crude collision detection" ([Shrinkwrap](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/shrinkwrap.html)).
- **Shading (JUDGEMENT):**
  - Base colour a little lighter and pinker than the bag.
  - SSS Random Walk (Skin).
  - Roughness about 0.4, plus Coat about 0.5 for wetness.
  - Fine Voronoi/noise bump for papillae: larger domes toward the tip, per the anatomy above.
  - A shallow median groove.
  - AO darkening where the tongue meets the floor.

---

## 4. Jaw and lip rig

### 4.1 Separate jaw from lips (JALI)

- JALI models visible speech as "two visually distinct anatomical actions: Jaw and Lip". The rig is "a composition of a neutral face … overlaid with skeletal jaw and tongue deformation … displaced by a linear blend of weighted blend-shape action unit displacements". Per phoneme: `face(p, JA, LI) = nface + JA*(jd(p)+td(p)) + LI*au(p)` ([Edwards et al., JALI, SIGGRAPH 2016, §3.2](https://dgp.toronto.edu/~elf/JALISIG16.pdf)).
- **Neutral pose.** JALI's neutral is configured "so that the character's jaw hangs open slightly … and the lips are locked with a low-intensity use of the 'lip-tightening' muscle". That neutral is described as "more faithful to a relaxed human face than the commonly used neutral face, with jaw clenched shut" ([JALI §3.2](https://dgp.toronto.edu/~elf/JALISIG16.pdf)).
  - **JUDGEMENT:** this also solves our voxel problem. Model the rest mouth *open* by at least 3 voxels at centre so the remesher keeps the gap, and make "lips closed" a shape key.

### 4.2 What Rigify's face rig actually does (source-level)

From [skin_jaw.py](https://projects.blender.org/blender/blender-addons/src/branch/main/rigify/rigs/face/skin_jaw.py) and the [manual](https://docs.blender.org/manual/en/4.2/addons/rigging/rigify/rig_types/face.html):

- **Three mechanism bones per lip layer: top, bottom, middle.** The *middle* bone is parented to *top* and copies *bottom* at influence 0.5, so it sits halfway between the lips.
- **Mouth corners get only the middle bone.** Non-corner lip controls blend `side_mch` (top or bottom) with `middle_mch`. The weight is `factor = sqrt(1 - clamp(x/x_corner)^2)`, where x is the position across the mouth.
  - This elliptical profile is exactly what turns a hinge into an **oval**. The centre follows the lip fully, the corners stay at the midpoint, and in between follows an ellipse.
- **"Bottom Lip Influence"** (default 0.5) is the jaw influence on the inner bottom lip with mouth lock off.
- **"Locked Influence"** (default 0.2) and a **"Mouth Lock"** slider pull both inner lips to a lock bone that follows the jaw at that influence, which is "Mouth is locked closed".
- **"Secondary Influence Falloff"** (default 0.5) fades influence by that factor per outer lip loop.
- The skin chains' **Sharpen Corner** option forms "a sharp corner at the relevant connected end, depending on the angle formed by adjacent control locations" ([Rigify Skin rig types](https://docs.blender.org/manual/en/4.2/addons/rigging/rigify/rig_types/skin.html)).

Note: this source is the `blender-addons` repository, where Rigify lived until it became an extension. The file I read is on its `main` branch. Whether the current Rigify extension still matches it is **UNVERIFIED**, but the manual text matches.

### 4.3 Bones vs. shape keys

- **Blender Studio, facial rigging with shape keys.** Rik Schutte: "the overwhelming majority of feature film facial rigs use the same method: a lot … of blendshapes, or what we call shape keys". In the prototype, lips, mouth corners, cheeks and brows are shape keys, while "the jaw, head, and neck remain bone-driven". A temporary armature generates the range of motion, which "should get us 85% to the final shapes" ([Blender Studio blog](https://studio.blender.org/blog/proposal-facial-rigging-with-shape-keys/)).
- **Blender Studio course (Blender 5.0+).** The *Advanced Facial Rigging* course covers:
  - Lips via ribbon meshes, including a "Lip zipper"
  - "Mouth Corner Shape Keys", including "Combination shape keys", "Mouth open corrective shape keys" and "Mouth squash"
  - teeth and tongue

  It notes that "The order of corrective shape keys is important" ([course index](https://studio.blender.org/training/facial-rigging/), [mouth-corner concept](https://studio.blender.org/training/facial-rigging/mouthcorners-concept/)). The lessons themselves are paywalled, so the details are **UNVERIFIED**.
- **Disney (Bolt).** Their rig combines geometric deformers *and* blendshapes via pose-space deformation ([Disney 2010](https://media.disneyanimation.com/uploads/production/publication_asset/52/asset/hybridFacialTalk.pdf)).
- **For us (JUDGEMENT): hybrid, per JALI.**
  - one **jaw bone**, for the rotational arc
  - **lip shape keys** for the Rhubarb visemes
  - **corrective shape keys** driven by jaw angle
  - optionally, **corner** controls as shape keys (`corner_up/down/in/out`, per side)

### 4.4 Sticky lips / lip zipper

- Rigify's version is the "Mouth Lock" slider (§4.2). Blender Studio's course has a "Lip zipper" lesson ([course index](https://studio.blender.org/training/facial-rigging/)). SIGGRAPH 2022 talks include a studio presentation on "their take on the sticky lips problem" ([SIGGRAPH 2022 talks list](https://www.siggraph.org/wp-content/uploads/2022/08/SIGGRAPH-22-ACM-SIGGRAPH-2022-Talks.html); implementation **UNVERIFIED**).
- **Procedural version (JUDGEMENT).** Add a `lips_zip` shape key. Its offset moves lip-edge vertices (small d, |s| < lip thickness) toward the mid-surface s = 0. Mask it with a per-vertex factor `smoothstep(1 - zip - w, 1 - zip, |u|)`, driven by a `zip` property, so sealing starts at the corners and travels inward. A single shape key cannot move its mask, so build it as N stacked keys, one per |u| band, each driven by `clamp((zip - band_start)/band_width)`.

### 4.5 Corner pinning and an oval/crescent opening instead of a hinge

**JUDGEMENT**, directly adapting Rigify's formula to vertex weights. For a vertex at normalised mouth coordinate u ∈ [-1, 1] (0 = centre, ±1 = corners):

```
ell(u)      = sqrt(max(0, 1 - u*u))              # Rigify skin_jaw factor
lower_lip_w = 0.5 + 0.5*ell(u)                   # centre follows jaw fully, corner 0.5
upper_lip_w = 0.5*(1 - ell(u))                   # centre 0, corner 0.5
```

- Both lips reach **0.5 at the corner**, so the corner cannot tear open like a hinge. The opening outline becomes the ellipse's lens/crescent.
- Moving *away* from the lip edge, blend toward a rigid jaw (lower side → 1) or a rigid skull (upper side → 0) with `smoothstep(0, R, |s|)`, R ≈ 1–2 lip thicknesses. This is the vertex equivalent of Rigify's per-loop "Secondary Influence Falloff".
- Add a **`jaw_open_fix` corrective shape key**, driven by jaw angle. It should:
  1. round the lower lip into a crescent
  2. pull the corners slightly inward and down
  3. keep the lip thickness from thinning
  4. fill the throat (see §4.6)

  Blender Studio's course has exactly this category: "Mouth open corrective shape keys" ([course](https://studio.blender.org/training/facial-rigging/)).

### 4.6 Jaw pivot, throat falloff, correctives (fix for the crease behind the jaw)

- **Pivot.** In lizards the jaw hinge is the quadrate–articular joint, "one of the three synovial joints that are highly conserved among lizards", at the back of the skull (Payne et al. 2011, Anat. Rec., <https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/ar.21329>; from abstract/search snippet, **UNVERIFIED** in full text). Rigify's human metarig jaw chain also starts high and far back: `jaw.L` head at z 1.874 versus the lip line at about 1.81, and about 11 cm behind the lips ([human.py](https://projects.blender.org/blender/blender-addons/src/branch/main/rigify/metarigs/human.py)). **JUDGEMENT:** put the gecko's jaw pivot behind *and above* the mouth corners, about under the rear of the eye and at or above the lip-line height, not at the corners. The lower jaw then swings down and slightly back as a rigid scoop.
- **Weights.** The crease comes from a hard step (`y < -0.24`). Replace it with a product of smooth fields (**JUDGEMENT**):
  - `w = lipside(u, s) * throat(x)`
  - `throat(x) = 1 - smoothstep(x_angle, x_angle + L, x)`, where x is the distance behind the jaw angle along the head axis and L is 30–50 % of head length, so the throat skin stretches over a long distance instead of folding.
  - Then run `bpy.ops.object.vertex_group_smooth(factor=0.5, repeat=10..30)` ([API](https://docs.blender.org/api/current/bpy.ops.object.html#bpy.ops.object.vertex_group_smooth)). Smoothing follows mesh connectivity, so it cannot bleed across an *open* lip gap. That is another reason to model the rest mouth open.
  - Blender also has a **Vertex Weight Proximity** modifier, with falloff types Linear/Sharp/Smooth/Root/Sphere/Curve, that computes weights from distance to a target object ([Weight Proximity](https://docs.blender.org/manual/en/latest/modeling/modifiers/modify/weight_proximity.html)). It is an alternative to computing the falloff in Python.
- **Clean-up modifiers.**
  - Put **Corrective Smooth** after Armature. It "is typically useful after an Armature modifier, where distortion around joints may be hard to avoid, even with careful weight painting". Use a vertex group restricted to the jaw/throat band and `smooth_type='LENGTH_WEIGHTED'` ([Corrective Smooth](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/corrective_smooth.html); [API](https://docs.blender.org/api/current/bpy.types.CorrectiveSmoothModifier.html)).
  - Optionally turn on Armature **Preserve Volume** (quaternion skinning). Without it, "rotations at joints tend to scale down the neighboring geometry" ([Armature modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/armature.html)).
- **Corrective shape key for jaw-open.** Sculpt, or compute analytically, the throat volume and the smoothed stretch at full open. Drive it from jaw rotation (§6 step 9). Blender Studio's Pose Shape Keys workflow computes such correctives in deformed space: "Delta = Beautiful Mesh - Deformed Mesh" ([Blender Studio blog](https://studio.blender.org/blog/rig-with-shape-keys-like-never-before/)). The underlying API is `Object.crazyspace_eval` / `crazyspace_displacement_to_original` ([API](https://docs.blender.org/api/current/bpy.types.Object.html#bpy.types.Object.crazyspace_eval)).

### 4.7 How far the mouth should extend (fix for the clamshell)

- Pixar notes that "the mouth disappears from certain angles under the muzzle", and the cheek reaction carries the performance there ([Articulating the Appeal](https://web.archive.org/web/2024id_/https://graphics.pixar.com/library/ArticulatingAppeal/paper.pdf)). The corner line should be as close to horizontal as possible ([Softimage](https://download.autodesk.com/global/docs/softimage2014/en_us/userguide/files/face_modeling_ModelingtheMouthArea.htm)).
- **JUDGEMENT (from the two reference images):**
  - Separate the **visual smile line** from the **functional opening**.
  - The Bruni-style lizard's line runs far back toward the jaw hinge, but it is a *closed sculpted crease*.
  - Toothless's parting lips end well in front of the hinge, and the corners are pinched.
  - For the gecko, limit the *opening*, meaning the carved gap plus the ell(u) domain, to about ±45–55° around the head from the front. Continue the smile line behind the corner as a non-opening groove: a displacement or bump (see §4.8), weighted 0.5 at the corner and fading to the lipside blend.
  - From below you should then see a closed jaw line with an opening only at the front.

### 4.8 Stylized skin folds without booleans (fix for the sawtooth throat)

- **Scale by scale.** Bump mapping is for small details, "for example pores or wrinkles on skin". True displacement "requires the mesh to be finely subdivided", and the two can be combined ([Displacement](https://docs.blender.org/manual/en/latest/render/materials/components/displacement.html)). The **Displace modifier** moves vertices "based on the intensity of a texture" along the normal, with a Vertex Group for influence ([Displace](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/displace.html)).
- **Recipe (JUDGEMENT):**
  1. **Static folds** (throat bands, the smile-line groove): compute an analytic offset in bmesh, `offset = -depth * exp(-(dist_to_fold_curve / width)^2)` along the normal, applied *before* rigging. Keep `width` ≥ 3–4 edge lengths so the fold is resolved and not aliased into a sawtooth.
  2. **Fine creases:** add a shader Bump driven by the same distance field, or by a texture.
  3. **Dynamic folds** that deepen when the jaw closes or the neck bends: use a corrective shape key, or drive the Bump strength with a driver from jaw angle.

  Never use booleans for folds. A boolean cuts sharp slivers whose width is below the mesh resolution.

---

## 5. Lip sync

### 5.1 Rhubarb Lip Sync (v1.14.0, released 2025-04-03)

Source for this subsection: the [README](https://github.com/DanielSWolf/rhubarb-lip-sync) and the [release page](https://github.com/DanielSWolf/rhubarb-lip-sync/releases/tag/v1.14.0).

- **Shapes.** Six basic shapes A–F "invented at the Hanna-Barbera studios", plus the optional extended shapes G, H, X:

  | Shape | Description |
  |---|---|
  | A | closed, "P B M" |
  | B | "slightly open mouth with clenched teeth", most consonants and "EE" |
  | C | open, "EH", "AE"; also the in-between A/B→D |
  | D | wide open, "AA" |
  | E | slightly rounded, "AO", "ER"; also the in-between C/D→F |
  | F | puckered, "UW", "OW", "W" |
  | G | "F", "V" |
  | H | long "L", tongue raised |
  | X | idle, "closed but relaxed" |

- **CLI.** `rhubarb -o out.json -f json -d dialog.txt [--extendedShapes GHX] [-r pocketSphinx|phonetic] input.wav`. The audio file "must be the last command-line argument". Formats are tsv, xml, json and dat; `--datUsePrestonBlair` maps A→MBP, B→etc, C→E, D→AI, E→O, F→U, G→FV, H→L, X→rest. Inputs are WAVE or Ogg Vorbis. "It is always a good idea to specify the dialog text".
- **Output semantics.** Each cue is a start time and a shape. The final TSV line is always the end time with X or A. Example: "0.05s … mouth opens wide (D) for the 'HH' sound, anticipating the 'AY'".
- **Internals useful for 3D.** From the Rhubarb source:
  - phoneme→shape rules, e.g. `M → A`, `P/B → A`, `F/V → G`, `AA → D`, `UW → F`, `IY → B`, `L → H` when ≥ 0.20 s ([animationRules.cpp](https://github.com/DanielSWolf/rhubarb-lip-sync/blob/master/rhubarb/src/animation/animationRules.cpp))
  - plosive occlusion inserted 40–120 ms before the release
  - tweens of 40–80 ms ([tweening.cpp](https://github.com/DanielSWolf/rhubarb-lip-sync/blob/master/rhubarb/src/animation/tweening.cpp))
  - minimum shape duration 70 ms ([timingOptimization.cpp](https://github.com/DanielSWolf/rhubarb-lip-sync/blob/master/rhubarb/src/animation/timingOptimization.cpp))

  Rhubarb therefore already bakes in anticipation and in-betweens for *hold-style* 2D animation.
- **Blender integration.** Rhubarb itself lists none. Third-party add-ons exist: [scaredyfish/blender-rhubarb-lipsync](https://github.com/scaredyfish/blender-rhubarb-lipsync) (pose library), and [Premik/blender_rhubarb_lipsync_ng](https://github.com/Premik/blender_rhubarb_lipsync_ng), which claims testing through Blender 5.2 and supports shape-key targets via NLA. Treat these as leads; we will script our own.

### 5.2 macOS status: verified on this machine

- The official macOS binary is **x86_64 only** (checked with `file`). It needs Rosetta on this arm64 Mac.
- `rhubarb --version` works. **Every analysis run crashed with SIGSEGV at about 6 % progress** (exit 139), with default, `--threads 1`, `-r phonetic`, and 16 kHz or 22 kHz 16-bit PCM input. The crash report shows `sphinxLogCallback → vsnprintf` on macOS 26.5.2.
- This matches open issue #140, "Rhubarb crashes on MacOs x86_64 … about 6% into processing and crashes", whose reporter says it "builds and runs fine on arm64" ([issue #140](https://github.com/DanielSWolf/rhubarb-lip-sync/issues/140)). A native arm64 build is **UNVERIFIED** here.
- **Options:**
  - (a) build Rhubarb from source natively (CMake + Boost, per README "Building")
  - (b) run the Linux build in Docker
  - (c) skip Rhubarb: take ElevenLabs timestamps and apply Rhubarb's phoneme→shape table ourselves (§5.3)

### 5.3 ElevenLabs route (for when we swap audio)

- `POST /v1/text-to-speech/{voice_id}/with-timestamps` returns `audio_base64` and an `alignment` / `normalized_alignment` with `characters`, `character_start_times_seconds` and `character_end_times_seconds`. `output_format` includes `wav_16000 … wav_48000` and `pcm_*`; the default is `mp3_44100_128` ([ElevenLabs API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps)).
- **Pipeline.** Request a `wav_*` format, which Rhubarb accepts directly, and keep the text as the `-d` dialog file.
- **Fallback if Rhubarb will not run.** Turn the character timings into word timings. Convert words to ARPAbet with a pronouncing dictionary (CMUdict is the usual choice, **UNVERIFIED**/not fetched). Split each word's time evenly across its phonemes, **JUDGEMENT**. Then apply Rhubarb's `animationRules.cpp` table plus JALI's co-articulation rules (§5.4).

### 5.4 Timing and co-articulation (JALI)

From [JALI §4.2](https://dgp.toronto.edu/~elf/JALISIG16.pdf):

- **Constraints:**
  - "Bilabials (m b p) must close the lips"
  - "Labiodentals (f v) must touch bottom-lip to top-teeth"
  - "Sibilants … narrow the jaw greatly"
  - "Non-Nasal phonemes must open the lips at some point"
- **Habits:**
  - duplicated visemes merge
  - lip-heavy visemes (UW OW OY w S Z J C) "start early … and end late"
  - "Tongue-only visemes (l n t d g k N) have no influence on the lips"
  - pauses "usually leave the mouth open"
- **Curve timing:**
  - onset 120 ms before the apex; the apex "coincides with the beginning of the sound"
  - sustain to 75 % of the phoneme, then 120 ms decay
  - lip protrusion 150 ms
  - bilabial onsets measured at 127–240 ms depending on context
- **Jaw from loudness (Table 1).** Compare vowel intensity to the clip's mean and standard deviation:
  - ≤ mean − sd → Jaw 0.1–0.2
  - ≈ mean → 0.3–0.6
  - ≥ mean + sd → 0.7–0.9

  **JUDGEMENT:** this is the principled replacement for our raw RMS→jaw mapping.

### 5.5 Combining a viseme track with a jaw track

**JUDGEMENT**, implementing JALI's `JA*jaw + LI*lips` split on Rhubarb shapes. Each Rhubarb shape maps to:
- a *jaw target* (0–1 of max jaw angle)
- a *lip-shape key* weight

Starting values:

| Rhubarb | jaw target | lip keys (value 1 unless noted) |
|---|---|---|
| X (rest) | 0.0 | `lips_closed` 1 (relaxed) |
| A (M/B/P) | 0.0 | `lips_closed` 1, `lips_press` 0.6 |
| B (most consonants, EE) | 0.12 | `lips_wide` 0.5 |
| C (EH/AE) | 0.40 | `lips_wide` 0.3 |
| D (AA) | 0.85 | none (jaw only; `jaw_open_fix` rides on jaw) |
| E (AO/ER) | 0.35 | `lips_round` 0.6 |
| F (UW/OW/W) | 0.12 | `lips_pucker` 1 |
| G (F/V) | 0.05 | `lowerlip_tuck` 1 (lower lip up under upper) |
| H (L) | 0.45 | `tongue_up` (tongue bone action) |

- Final jaw = `viseme_jaw_target(t) * JA(t)`, where JA comes from the §5.4 loudness bands. Final lip keys = `viseme_weight(t) * LI(t)`, with LI constant at about 0.8 to start.
- Rhubarb already anticipates, so key each shape's apex at its cue start. Ramp up from `cue_start - 2 frames` (about 80 ms at 24 fps, inside Rhubarb's 40–80 ms tween range and below JALI's 120 ms onset). Ramp the previous shape down over the same window.
- Keep our existing global lead offset (1 frame) as a tunable parameter.

### 5.6 Keying in Blender 5.x (API facts)

- Legacy `Action.fcurves` is **not** in the 5.x `Action` API. Use `Action.fcurve_ensure_for_datablock(datablock, data_path, index=0, group_name="")`. The action "must already be assigned to the data-block", and the call "will also create the layer, keyframe strip, and action slot if necessary" ([Action API](https://docs.blender.org/api/current/bpy.types.Action.html)). Then use `FCurve.keyframe_points.insert(frame, value)` ([FCurveKeyframePoints](https://docs.blender.org/api/current/bpy.types.FCurveKeyframePoints.html)).
- The simpler route also works: `key_block.keyframe_insert("value", frame=f)` ([bpy_struct.keyframe_insert](https://docs.blender.org/api/current/bpy.types.bpy_struct.html#bpy.types.bpy_struct.keyframe_insert)).
- Channelbag helpers live in `bpy_extras.anim_utils` (`action_ensure_channelbag_for_slot`, etc.) ([anim_utils](https://docs.blender.org/api/current/bpy_extras.anim_utils.html)).
- **Sound strip:** `scene.sequence_editor.strips.new_sound(name, filepath, channel, frame_start)` ([StripsTopLevel](https://docs.blender.org/api/current/bpy.types.StripsTopLevel.html)).
- **Audio-to-curve** (like our current RMS approach, built in): `bpy.ops.graph.sound_to_samples(filepath=…, low=…, high=…, attack=0.005, release=0.2)` "Bakes a sound wave to samples on selected channels" ([graph ops](https://docs.blender.org/api/current/bpy.ops.graph.html#bpy.ops.graph.sound_to_samples)).

---

## 6. Procedural recipe (bpy/bmesh)

Everything below is **JUDGEMENT** built on the cited APIs. The code is an untested sketch.

**Step 1. Mouth frame.** Define the smile curve as a polyline C(t), t ∈ [-1, 1], in head-local space. Include the corner parameter `t_c` (the end of the *opening*, about ±50°) and the extended groove beyond it. Also define a lip "up" vector field n(t), perpendicular to the curve and tangent to the head surface.

**Step 2. Rest-open mouth cavity *before* voxel remesh.** Carve the bag as a boolean. Do not use a thin wedge; use a proper volume:
- a swept rounded cutter along C(t) for |t| ≤ t_c
- gap at centre ≥ 3 × voxel size, tapering toward the corners
- a lip fillet radius equal to the lip thickness
- the bag volume behind it: floor trough, roof, throat funnel

Then voxel-remesh (`Mesh.remesh_voxel_size`, `bpy.ops.object.voxel_remesh()`, [Remeshing](https://docs.blender.org/manual/en/latest/modeling/meshes/retopology.html)). The remesher fuses the gap where it thins below about 2 voxels, which gives us sealed, rounded corners for free. **Do not decimate the head**, or protect it with a Decimate vertex group at factor 1.

**Step 3. Per-vertex lip coordinates.** Build a KDTree over dense samples of C(t) (`mathutils.kdtree`). For each vertex, compute:
- `u` = t / t_c (|u| > 1 means behind the corner)
- `s` = signed distance along n (+ is upper)
- `d` = depth behind the lip-inner-edge (0 on the outer skin)
- `side` = upper/lower, from the sign of s. This is unambiguous because the rest gap exists.

Store them as float attributes (`mesh.attributes.new("lip_u", 'FLOAT', 'POINT')`, etc.) so the shaders can reuse them.

**Step 4. Jaw weights** (vertex group `DEF-jaw`) and head weights = 1 − jaw inside the head region.

```python
import math
def smoothstep(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0); return t * t * (3 - 2 * t)

def jaw_weight(u, s, x_back, lip_t, R, x_angle, L):
    ell = math.sqrt(max(0.0, 1.0 - u * u))              # Rigify skin_jaw profile
    if abs(u) <= 1.0:                                   # inside the opening
        w_edge = (0.5 + 0.5 * ell) if s < 0 else 0.5 * (1.0 - ell)
    else:                                               # behind the corner: sealed crease
        w_edge = 0.5
    rigid = 1.0 if s < 0 else 0.0                       # far below = jaw, far above = skull
    w = w_edge + (rigid - w_edge) * smoothstep(0.0, R, abs(s))
    return w * (1.0 - smoothstep(x_angle, x_angle + L, x_back))  # long throat falloff

vg = obj.vertex_groups.new(name="DEF-jaw")
for i, c in enumerate(coords):
    vg.add([i], jaw_weight(*c), 'REPLACE')
# then: bpy.ops.object.vertex_group_smooth(factor=0.5, repeat=20)  (active group, Weight/Object mode context)
```

- Bag interior: floor = 1, roof = 0, back of throat → 0.5, then fade to 0.
- Tongue: separate object, rigid-parented to the jaw bones (Step 8).

**Step 5. Armature.** Jaw pivot per §4.6. Use a `CTL-jaw` control with a custom property `jaw_open` (0–1). The `DEF-jaw` X rotation is driven by `jaw_open * max_angle` (simple expression). The body stack is: **Armature (Preserve Volume optional) → Corrective Smooth** (`smooth_type='LENGTH_WEIGHTED'`, vertex group = jaw/throat band) → **Subdivision Surface** (render). Shape keys evaluate before modifiers.

**Step 6. Shape keys, analytic.** Create the Basis with `obj.shape_key_add(name="Basis", from_mix=False)` ([Object.shape_key_add](https://docs.blender.org/api/current/bpy.types.Object.html#bpy.types.Object.shape_key_add)). For each key:

```python
import numpy as np
base = np.empty(len(me.vertices) * 3); me.vertices.foreach_get("co", base)
sk = obj.shape_key_add(name="lips_pucker", from_mix=False)
co = base.reshape(-1, 3) + delta_fn(U, S, D, N)      # vectorised field
sk.points.foreach_set("co", co.ravel())            # ShapeKey.points: optimised foreach access
sk.slider_min, sk.slider_max = 0.0, 1.0
```

Keys to build ([ShapeKey](https://docs.blender.org/api/current/bpy.types.ShapeKey.html)):
- `lips_closed`: moves both lip edges to s = 0, weighted by `exp(-(d/lip_t)^2)`. It turns the rest-open gap into a closed mouth.
- `lips_press`
- `lips_wide`: pushes the corners outward along C
- `lips_round`
- `lips_pucker`: pulls |u| toward 0 and moves forward
- `lowerlip_tuck`
- `corner_up/down.L/.R`, masked per side with `ShapeKey.vertex_group`
- `lips_zip_band_k` (§4.4)
- correctives: `jaw_open_fix`, `throat_fill`

**Step 7. Drivers** ([driver_add](https://docs.blender.org/api/current/bpy.types.bpy_struct.html#bpy.types.bpy_struct.driver_add); [DriverVariable](https://docs.blender.org/api/current/bpy.types.DriverVariable.html); [DriverTarget](https://docs.blender.org/api/current/bpy.types.DriverTarget.html)):

```python
kb = obj.data.shape_keys.key_blocks["jaw_open_fix"]
fc = kb.driver_add("value"); drv = fc.driver; drv.type = 'SCRIPTED'
v = drv.variables.new(); v.name = "rot"; v.type = 'TRANSFORMS'
t = v.targets[0]; t.id = rig; t.bone_target = "DEF-jaw"
t.transform_type = 'ROT_X'; t.transform_space = 'LOCAL_SPACE'; t.rotation_mode = 'SWING_TWIST_X'
drv.expression = "clamp(rot / 0.30, 0.0, 1.0)"   # simple expression: native, no Python
```

Stick to the "Simple Expressions" subset (`clamp`, `smoothstep`, `lerp`, arithmetic). These "are evaluated even when Python script execution is disabled" and avoid the "Slow Python expression" warning ([Drivers panel](https://docs.blender.org/manual/en/latest/animation/drivers/drivers_panel.html)).

**Step 8. Tongue.**
- Mesh: build in bmesh as a lofted flattened capsule along 4 bone segments, with its root intersecting the bag floor so the seam is hidden. Sizes per §3.
- Rig: bones `DEF-tongue.000–.003`, parented to the jaw. `use_deform=True`, B-bone segments 8. A `tongue_curl` property drives each bone's X rotation with weights `1-(1+i)/n`, per Rigify.
- Collision: Shrinkwrap "Inside" against a slightly shrunk copy of the bag.

**Step 9. Materials.**
- Skin material on the lip roll. Interior colour from the `lip_d` attribute via an Attribute node (`ShaderNodeAttribute`, attribute_type `GEOMETRY`) → ColorRamp (skin → pink → red → maroon → near-black).
- Multiply by AO (Only Local).
- Principled: SSS Random Walk (Skin), roughness 0.35–0.5, Coat 0.3–0.6 at roughness 0.1–0.2, a noise bump.
- Tongue as §3.

**Step 10. Lip-sync keying.**

```python
import json, subprocess
subprocess.run([RHUBARB, "-q", "-f", "json", "-d", dialog_txt, "--extendedShapes", "GHX",
                "-o", cues_json, wav_path], check=True)           # wav must be last arg
cues = json.load(open(cues_json))["mouthCues"]                    # [{start,end,value}]
fps = scene.render.fps / scene.render.fps_base
key = obj.data.shape_keys
key.animation_data_create()
act = bpy.data.actions.new("gecko_visemes"); key.animation_data.action = act
def fcurve(path): return act.fcurve_ensure_for_datablock(key, path)
RAMP = 2  # frames
for c in cues:
    f0 = start_frame + c["start"] * fps
    for name, w in VISEME_TABLE[c["value"]]["lips"].items():
        fc = fcurve(f'key_blocks["{name}"].value')
        fc.keyframe_points.insert(f0 - RAMP, 0.0)   # ensure previous shape ramps out: key all
        fc.keyframe_points.insert(f0, w * LI)       # other lip keys to 0 at f0 as well
# jaw: key CTL-jaw["jaw_open"] = VISEME_TABLE[v]["jaw"] * JA(t) on the armature's own action
scene.sequence_editor_create()
scene.sequence_editor.strips.new_sound("vo", wav_path, channel=1, frame_start=start_frame)
```

- JA(t) comes from vowel loudness bands (JALI Table 1), computed with numpy on the wav.
- Enforce JALI's hard rule after keying: at every A-cue (M/B/P), `lips_closed` = 1 and jaw ≤ 0.05.

---

## 7. Recommended implementation for the gecko (prioritised)

**P1. Rebuild the mouth geometry as a rest-open, voxel-clean mouth bag** (fixes the rubber rim and the streaks).
- Carve a rounded, fillet-lipped cavity *before* the voxel remesh, with a centre gap of at least 3 voxels. It should be a real bag (floor trough, roof, throat funnel), not a 3.5 mm wedge.
- Stop decimating the head, or protect it with a Decimate vertex group at factor 1.
- Add Subdivision Surface at render.
- The lip roll stays **skin-coloured**; the pink interior starts 2–4 mm inside, via a depth-attribute gradient.

**P2. Limit the functional opening to about ±45–55°** and continue the smile line as a closed sculpted groove (fixes the clamshell). Corners weighted 0.5/0.5.

**P3. Replace the jaw weights with the smooth analytic field in §6 step 4** (fixes the crease behind the jaw):
- the Rigify ellipse profile on the lips
- smoothstep falloff away from the lip edge
- a long throat falloff (L = 30–50 % of head length)
- `vertex_group_smooth`
- Corrective Smooth after Armature
- jaw pivot moved behind and above the corners, near the quadrate position

**P4. Correctives driven by jaw angle.** `jaw_open_fix` covers the crescent lower lip, corners pulled in and down, and lip thickness kept. `throat_fill` covers throat volume. Use simple-expression drivers.

**P5. New tongue:**
- broad: 70–85 % of the inner jaw width, filling the floor
- root sunk into the bag, top just under the lower-lip line
- 4-bone B-bone chain parented to the jaw, with graduated curl
- wet SSS material with papillae bump

**P6. Lip shape keys** for the Rhubarb set (table in §5.5), built analytically in lip space, including `lips_closed` (turns rest-open into closed) and per-side corner keys.

**P7. Lip-sync driver swap:**
- Run Rhubarb (JSON, with `-d` dialog) to get the viseme track, keyed with 2-frame ramps.
- Build a jaw track from the viseme jaw targets × JALI loudness bands; this replaces the raw RMS→jaw mapping.
- Enforce bilabial closure.
- **Blocker:** the official macOS binary crashes on this Mac (§5.2). Build arm64 from source, or use the ElevenLabs `/with-timestamps` + phoneme-table fallback.

**P8. Skin folds.** Remove the boolean throat grooves. Use analytic normal-offset folds (width ≥ 3–4 edges) plus a shader Bump; make dynamic folds with jaw-driven corrective keys or bump strength.

**P9 (optional). Lip zipper / sticky lips** via banded `lips_zip` keys driven by one `zip` property.

**P10 (optional, later). Surface Deform proxy** (clean concentric-loop patch, Sparse Bind per lip) if analytic shapes prove too "mathematical" and we want sculpted mouth shapes.

---

## 8. Open questions / UNVERIFIED

1. **Rhubarb on Apple Silicon.** A native arm64 build is reported to work in [issue #140](https://github.com/DanielSWolf/rhubarb-lip-sync/issues/140) but was not tested here. The x86_64 release crash is verified locally. Docker (Linux build) is also untested.
2. **Voxel gap threshold.** "About 2 voxels fuse" is inferred from how the remesher works, not stated in the manual. Measure it with a test cutter at 0.0065.
3. **Mesh Deform** resolving a thin lip slit at practical Precision values: untested.
4. **Surface Deform cross-lip mis-binding** at a 3–10 mm gap: untested. The Sparse Bind per-lip mitigation is a proposal.
5. **QuadriFlow's `use_preserve_boundary`** producing mouth-concentric loops: untested. The manual's description of the option is a copy-paste error.
6. **Rigify extension parity.** The code read is from the archived `blender-addons` repository (`main`). The current extension may differ.
7. **Blender Studio paywalled lessons** (Lip zipper, Mouth open correctives, Teeth & Tongue): only titles and descriptions were readable. The contents are unverified.
8. **SIGGRAPH 2022 "sticky lips" talk:** only the program listing was seen, not the method.
9. **Gecko tongue anatomy and lizard jaw-joint location:** taken from abstracts and search snippets (Wiley pages returned 403).
10. **All numeric starting values** are JUDGEMENT and need render tests: jaw targets per viseme, 2-frame ramps, ±45–55° opening, 70–85 % tongue width, coat/roughness ranges, falloff lengths.
11. **CMUdict** as the phoneme source for the ElevenLabs fallback was not fetched or verified here.
12. **Premik's `blender_rhubarb_lipsync_ng`** claims Blender 5.2 support. It is third-party and was not tested.

---

## Sources (primary)

- Blender Manual (5.1, `latest`):
  - [Surface Deform](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/surface_deform.html)
  - [Mesh Deform](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/mesh_deform.html)
  - [Corrective Smooth](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/corrective_smooth.html)
  - [Shrinkwrap](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/shrinkwrap.html)
  - [Data Transfer](https://docs.blender.org/manual/en/latest/modeling/modifiers/modify/data_transfer.html)
  - [Weight Proximity](https://docs.blender.org/manual/en/latest/modeling/modifiers/modify/weight_proximity.html)
  - [Armature](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/armature.html)
  - [Displace](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/displace.html)
  - [Decimate](https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/decimate.html)
  - [Remeshing](https://docs.blender.org/manual/en/latest/modeling/meshes/retopology.html)
  - [Shape Keys](https://docs.blender.org/manual/en/latest/animation/shape_keys/introduction.html)
  - [Drivers panel](https://docs.blender.org/manual/en/latest/animation/drivers/drivers_panel.html)
  - [Principled BSDF](https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/principled.html)
  - [AO node](https://docs.blender.org/manual/en/latest/render/shader_nodes/input/ao.html)
  - [Displacement](https://docs.blender.org/manual/en/latest/render/materials/components/displacement.html)
- Rigify:
  - [Face rig types (4.2 manual)](https://docs.blender.org/manual/en/4.2/addons/rigging/rigify/rig_types/face.html)
  - [Skin rig types (4.2 manual)](https://docs.blender.org/manual/en/4.2/addons/rigging/rigify/rig_types/skin.html)
  - [skin_jaw.py](https://projects.blender.org/blender/blender-addons/src/branch/main/rigify/rigs/face/skin_jaw.py)
  - [basic_tongue.py](https://projects.blender.org/blender/blender-addons/src/branch/main/rigify/rigs/face/basic_tongue.py)
  - [metarigs/human.py](https://projects.blender.org/blender/blender-addons/src/branch/main/rigify/metarigs/human.py)
- Blender Python API (current):
  - [Object](https://docs.blender.org/api/current/bpy.types.Object.html)
  - [ShapeKey](https://docs.blender.org/api/current/bpy.types.ShapeKey.html)
  - [Action](https://docs.blender.org/api/current/bpy.types.Action.html)
  - [bpy_struct](https://docs.blender.org/api/current/bpy.types.bpy_struct.html)
  - [bpy.ops.object](https://docs.blender.org/api/current/bpy.ops.object.html)
  - [bpy.ops.graph](https://docs.blender.org/api/current/bpy.ops.graph.html)
  - [StripsTopLevel](https://docs.blender.org/api/current/bpy.types.StripsTopLevel.html)
  - [DriverVariable](https://docs.blender.org/api/current/bpy.types.DriverVariable.html)
  - [DriverTarget](https://docs.blender.org/api/current/bpy.types.DriverTarget.html)
  - [CorrectiveSmoothModifier](https://docs.blender.org/api/current/bpy.types.CorrectiveSmoothModifier.html)
  - [DecimateModifier](https://docs.blender.org/api/current/bpy.types.DecimateModifier.html)
  - [anim_utils](https://docs.blender.org/api/current/bpy_extras.anim_utils.html)
- Blender Studio:
  - [Advanced Facial Rigging](https://studio.blender.org/training/facial-rigging/)
  - [Mouth-corner concept](https://studio.blender.org/training/facial-rigging/mouthcorners-concept/)
  - [Facial rigging with shape keys](https://studio.blender.org/blog/proposal-facial-rigging-with-shape-keys/)
  - [Pose Shape Keys](https://studio.blender.org/blog/rig-with-shape-keys-like-never-before/)
  - [Sprite Fright rigging videos](https://studio.blender.org/projects/sprite-fright/rigging/?asset=4509)
  - [Stylized Character Workflow: teeth, gums & tongue](https://studio.blender.org/training/stylized-character-workflow/5dc4235ef7f24231f6f62cae/)
- Papers:
  - [JALI (Edwards et al., SIGGRAPH 2016)](https://dgp.toronto.edu/~elf/JALISIG16.pdf)
  - [Harmonic Coordinates (Pixar)](https://web.archive.org/web/2024id_/https://graphics.pixar.com/library/HarmonicCoordinatesB/paper.pdf)
  - [Articulating the Appeal (Pixar)](https://web.archive.org/web/2024id_/https://graphics.pixar.com/library/ArticulatingAppeal/paper.pdf)
  - [Inside Out 2 rig talk (Pixar)](https://web.archive.org/web/2024id_/https://graphics.pixar.com/library/InsideOut2Rig/paper.pdf)
  - [A Hybrid Approach to Facial Rigging (WDAS)](https://media.disneyanimation.com/uploads/production/publication_asset/52/asset/hybridFacialTalk.pdf)
- Rhubarb Lip Sync:
  - [README](https://github.com/DanielSWolf/rhubarb-lip-sync)
  - [v1.14.0 release](https://github.com/DanielSWolf/rhubarb-lip-sync/releases/tag/v1.14.0)
  - [animationRules.cpp](https://github.com/DanielSWolf/rhubarb-lip-sync/blob/master/rhubarb/src/animation/animationRules.cpp)
  - [tweening.cpp](https://github.com/DanielSWolf/rhubarb-lip-sync/blob/master/rhubarb/src/animation/tweening.cpp)
  - [timingOptimization.cpp](https://github.com/DanielSWolf/rhubarb-lip-sync/blob/master/rhubarb/src/animation/timingOptimization.cpp)
  - [issue #140](https://github.com/DanielSWolf/rhubarb-lip-sync/issues/140)
- Vendor docs:
  - [Softimage: Modeling the Mouth Area](https://download.autodesk.com/global/docs/softimage2014/en_us/userguide/files/face_modeling_ModelingtheMouthArea.htm)
  - [Reallusion face topology guide](https://wiki.reallusion.com/Content_Dev:CC_Face_Topology_Guide)
  - [RenderMan 26 SSS parameters](https://rmanwiki-26.pixar.com/space/REN26/19661417/Subsurface+Scattering+Parameters)
  - [ElevenLabs TTS with timestamps](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps)

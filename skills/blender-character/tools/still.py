"""Render one frame headless. Deterministic: same file + args -> same image.

blender -b file.blend --python still.py -- --frame 179 --out /abs/path.png [--camera FaceCam] [--percent 40]
"""
import bpy, sys, argparse
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--frame", type=int, required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--camera", default=None)
ap.add_argument("--percent", type=int, default=40)
a = ap.parse_args(argv)
sc = bpy.context.scene
if a.camera: sc.camera = bpy.data.objects[a.camera]
sc.render.resolution_percentage = a.percent
sc.render.image_settings.file_format = 'PNG'
sc.frame_set(a.frame)
sc.render.filepath = a.out
bpy.ops.render.render(write_still=True)
print("still:", a.out)

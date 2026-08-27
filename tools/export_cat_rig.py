# Exports the cat from "cat.blend" to public/models/cat.glb.
#
# Run:  blender -b "../cat.blend" --python tools/export_cat_rig.py
#
# This is the cleanest of the three sources: the mesh is already skinned to a
# 38-bone armature, it has UVs, and its material already points at the texture
# that ships beside it. Two things still need fixing on the way out:
#
#   1. The tail is weighted across THREE coincident bone chains
#      (Bone.023/.024/.025 and their children all sit at identical positions).
#      Driving only one of them would deform roughly a third of the tail. The
#      duplicates' weights are merged into the first chain and the spare bones
#      removed, leaving a clean 5-bone tail.
#   2. Bones are generically named (Bone, Bone.001, ...), so they are renamed to
#      anatomical names derived from their world positions.
#
# The .blend on disk is never modified.
import bpy, os, traceback
from mathutils import Vector

print("=====CAT-START=====")

BLEND_DIR = os.path.dirname(bpy.data.filepath)
ARM_NAME = "Armature"
MESH_NAME = "cat"

arm = bpy.data.objects[ARM_NAME]
mesh = bpy.data.objects[MESH_NAME]

# --- 1. strip anything that is not the cat ------------------------------------
for o in list(bpy.data.objects):
    if o.name not in (ARM_NAME, MESH_NAME):
        bpy.data.objects.remove(o, do_unlink=True)
bpy.context.view_layer.update()

# --- 2. merge the duplicate tail chains ---------------------------------------
# Keys are the chain that survives; values are the coincident duplicates whose
# weights fold into it. Because the bones share a rest transform exactly, adding
# the weights together is lossless.
TAIL_MERGE = {
    "Bone.023": ["Bone.024", "Bone.025"],
    "Bone.026": ["Bone.027", "Bone.028"],
    "Bone.029": ["Bone.030", "Bone.031"],
    "Bone.032": ["Bone.033", "Bone.034"],
    "Bone.035": ["Bone.036", "Bone.037"],
}

idx_of = {g.name: g.index for g in mesh.vertex_groups}
merged_verts = 0
for keep, dupes in TAIL_MERGE.items():
    keep_group = mesh.vertex_groups.get(keep)
    if keep_group is None:
        continue
    dupe_idx = [idx_of[d] for d in dupes if d in idx_of]
    for v in mesh.data.vertices:
        extra = sum(ge.weight for ge in v.groups if ge.group in dupe_idx)
        if extra > 0:
            existing = next((ge.weight for ge in v.groups if ge.group == keep_group.index), 0.0)
            keep_group.add([v.index], min(1.0, existing + extra), "REPLACE")
            merged_verts += 1
print("tail weight merges applied to", merged_verts, "vertex/group pairs")

for dupes in TAIL_MERGE.values():
    for d in dupes:
        vg = mesh.vertex_groups.get(d)
        if vg:
            mesh.vertex_groups.remove(vg)

# Removing bones needs edit mode on the armature.
for o in bpy.context.view_layer.objects:
    o.select_set(False)
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
for dupes in TAIL_MERGE.values():
    for d in dupes:
        eb = arm.data.edit_bones.get(d)
        if eb:
            arm.data.edit_bones.remove(eb)
bpy.ops.object.mode_set(mode="OBJECT")
print("bones after merge:", len(arm.data.bones))

# --- 3. semantic bone names ---------------------------------------------------
# Derived from world positions. The cat faces -Y and +Z is up, so the animal's
# own left is +X (matching how the horse rig labels its sides).
RENAME = {
    "Bone": "Spine",
    "Bone.001": "Neck",
    "Bone.002": "Head",
    "Bone.003": "Nose",
    "Bone.004": "Jaw",
    "Bone.006": "Ear_L_01", "Bone.005": "Ear_R_01",
    # Front legs: .011 chain is +X (left), .007 chain is -X (right).
    "Bone.011": "ForeLeg_L_01", "Bone.012": "ForeLeg_L_02",
    "Bone.013": "ForeLeg_L_03", "Bone.014": "ForePaw_L",
    "Bone.007": "ForeLeg_R_01", "Bone.008": "ForeLeg_R_02",
    "Bone.009": "ForeLeg_R_03", "Bone.010": "ForePaw_R",
    # Hind legs: .019 chain is +X (left), .015 chain is -X (right).
    "Bone.019": "HindLeg_L_01", "Bone.020": "HindLeg_L_02",
    "Bone.021": "HindLeg_L_03", "Bone.022": "HindPaw_L",
    "Bone.015": "HindLeg_R_01", "Bone.016": "HindLeg_R_02",
    "Bone.017": "HindLeg_R_03", "Bone.018": "HindPaw_R",
    # Surviving tail chain, base -> tip.
    "Bone.023": "Tail_01", "Bone.026": "Tail_02", "Bone.029": "Tail_03",
    "Bone.032": "Tail_04", "Bone.035": "Tail_05",
}
for old, new in RENAME.items():
    b = arm.data.bones.get(old)
    if b:
        b.name = new
for old, new in RENAME.items():
    vg = mesh.vertex_groups.get(old)
    if vg:
        vg.name = new

bpy.context.view_layer.update()
bone_names = {b.name for b in arm.data.bones}
leftover = sorted({g.name for g in mesh.vertex_groups} - bone_names)
print("vertex groups with no matching bone:", leftover or "none")
unweighted = sum(1 for v in mesh.data.vertices if sum(g.weight for g in v.groups) <= 1e-6)
print("unweighted verts: %d / %d" % (unweighted, len(mesh.data.vertices)))

# --- 4. texture ---------------------------------------------------------------
# The colour map lives beside the .blend and is already wired to the material,
# so unlike the horse it maps correctly. Pack it so the GLB is self-contained.
for img in bpy.data.images:
    if img.source != "FILE" or img.packed_file:
        continue
    p = bpy.path.abspath(img.filepath)
    if not os.path.exists(p):
        print("skipping missing image:", img.name, p)
        continue
    if max(img.size) > 1024:
        img.scale(1024, 1024)
        print("scaled", img.name, "to 1024")
    img.pack()
    print("packed", img.name)

# --- 5. export ----------------------------------------------------------------
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(os.path.dirname(here), "public", "models", "cat.glb")
os.makedirs(os.path.dirname(out), exist_ok=True)
try:
    bpy.ops.export_scene.gltf(
        filepath=out, export_format="GLB", use_selection=False,
        export_yup=True, export_skins=True, export_animations=False,
        export_apply=False, export_cameras=False, export_lights=False,
        export_extras=False,
        export_image_format="WEBP", export_image_quality=88,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12,
        export_draco_generic_quantization=12,
    )
    print("size KB: %.1f" % (os.path.getsize(out) / 1024))
except Exception:
    traceback.print_exc()
print("=====CAT-END=====")

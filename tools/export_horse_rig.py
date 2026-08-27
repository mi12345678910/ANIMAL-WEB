# Exports the horse from "horse.blend" to public/models/horse.glb.
#
# Run:  blender -b "../horse.blend" --python tools/export_horse_rig.py
#
# This source needs considerably more work than the dog did. As authored it is a
# work-in-progress sculpt, not a game-ready asset:
#   * The mesh has NO skinning at all - no vertex groups, no armature modifier.
#   * The armature is a Rigify *metarig* (a template), and the "hors rig"
#     collection it would have generated into is empty.
#   * No material or texture is assigned to anything.
#   * The mane/tail is a bevelled curve, not a mesh.
#   * The colour map is a 22 MB 4096px TIFF, which no browser can use.
#
# So this script builds the deformable asset: it isolates the current horse,
# applies its modifiers, binds it to the metarig with automatic weights, wires
# up the chestnut colour map, and exports a compressed GLB. The .blend on disk
# is never modified.
import bpy, os, traceback
from mathutils import Vector

print("=====HORSE-START=====")

BLEND_DIR = os.path.dirname(bpy.data.filepath)
TEXTURE = os.path.join(BLEND_DIR, "Horse_textures_LessMuscules", "Horse_Chestnut_LessMuscules.tif")
ARM_NAME = "metarig"
# From the "curent hors" collection. "old horse" (Cylinder.002), "trush"
# (hair mesh 1) and the reference plane are all deliberately dropped.
BODY = "Cylinder.001"
DETAIL = "Cylinder.003"
HAIR_CURVE = "hair curve"

arm = bpy.data.objects[ARM_NAME]


def activate(obj):
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


# --- 1. isolate the current horse -------------------------------------------
# BEVEL is the profile curve the mane is swept along. It has to survive until
# after the conversion below — delete it first and the curve collapses to bare
# control-point edges and the mane exports as an empty mesh.
BEVEL = "BezierCircle"
keep = {ARM_NAME, BODY, DETAIL, HAIR_CURVE, BEVEL}
for o in list(bpy.data.objects):
    if o.name not in keep:
        bpy.data.objects.remove(o, do_unlink=True)
bpy.context.view_layer.update()

# The mane/tail is a curve bevelled along a circle; make it real geometry.
hair = bpy.data.objects.get(HAIR_CURVE)
if hair and hair.type == "CURVE":
    activate(hair)
    bpy.ops.object.convert(target="MESH")
    hair = bpy.context.view_layer.objects.active
    hair.name = "Mane"
    print("converted mane curve -> mesh:", len(hair.data.polygons), "polys")

# Now the profile curve has done its job.
bevel = bpy.data.objects.get(BEVEL)
if bevel:
    bpy.data.objects.remove(bevel, do_unlink=True)

meshes = [o for o in bpy.data.objects if o.type == "MESH"]

# --- 2. apply modifiers before skinning --------------------------------------
# Auto-weighting must run on the final symmetric geometry: weighting first and
# mirroring later would flip left/right influences on the mirrored half.
for o in meshes:
    activate(o)
    for md in list(o.modifiers):
        if md.type == "SUBSURF":
            md.levels = 1
            md.render_levels = 1
        try:
            bpy.ops.object.modifier_apply(modifier=md.name)
        except Exception as e:
            print("could not apply", md.name, "on", o.name, e)
    print("%-14s after modifiers: %d polys" % (o.name, len(o.data.polygons)))

# --- 3. limit which bones deform ---------------------------------------------
# Metarig bones are all deform=True by default. Eyes, nostrils, breast markers
# and the little mane tufts would each claim a blob of the surface and pull it
# around; the anatomical chain is what should drive the skin.
NON_DEFORM_PREFIXES = ("eye", "nose", "breast", "hair_base", "hair_top")
off = 0
for b in arm.data.bones:
    if b.name.startswith(NON_DEFORM_PREFIXES):
        b.use_deform = False
        off += 1
print("bones excluded from deform:", off, "| deforming:", sum(1 for b in arm.data.bones if b.use_deform))

# --- 4. coat colour -----------------------------------------------------------
# The supplied Horse_Chestnut_LessMuscules.tif CANNOT be used on this mesh.
# It is a well-made chestnut atlas (head, legs, hooves and eyes as separate
# islands) but it was authored for a DIFFERENT horse model. This sculpt has its
# own unwrap occupying a scattered ~35% of the UV square, so the atlas islands
# land on the wrong body parts: leg and hoof patches smear across the barrel and
# a bridle from the atlas paints itself over the face. Flipping V does not help,
# because the islands genuinely do not correspond.
#
# So the coat is solid colour sampled to match the atlas's chestnut, with a
# darker mane and tail for definition. To use the real texture the mesh needs
# unwrapping onto that atlas (or the atlas's original mesh supplied).
def srgb(hexstr):
    h = hexstr.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (out[0], out[1], out[2], 1.0)


def coat_material(name, hexstr, rough):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = srgb(hexstr)
    b.inputs["Roughness"].default_value = rough
    if "Specular IOR Level" in b.inputs:
        b.inputs["Specular IOR Level"].default_value = 0.25
    m.diffuse_color = srgb(hexstr)
    return m


mat_body = coat_material("M_Horse_Chestnut", "#9c5c33", 0.52)
mat_hair = coat_material("M_Horse_Mane", "#5a3520", 0.62)
for o in meshes:
    o.data.materials.clear()
    o.data.materials.append(mat_hair if o.name == "Mane" else mat_body)
print("materials assigned: chestnut body + darker mane/tail")

# --- 5. skin the mesh to the metarig -----------------------------------------
# Heat weighting needs the armature active and the meshes selected.
for o in bpy.context.view_layer.objects:
    o.select_set(False)
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = arm
try:
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    print("automatic weights: OK")
except Exception:
    traceback.print_exc()

for o in meshes:
    groups = len(o.vertex_groups)
    unweighted = 0
    for v in o.data.vertices:
        if sum(g.weight for g in v.groups) <= 1e-6:
            unweighted += 1
    print("%-14s vgroups=%-3d unweighted verts=%d / %d" % (o.name, groups, unweighted, len(o.data.vertices)))

# --- 6. semantic bone names ---------------------------------------------------
# The Rigify metarig naming is positional, not anatomical: the "spine" chain
# actually runs REARWARD from the root and is the tail. Verified from world
# positions - the horse faces -Y, so increasing Y is toward the rump.
RENAME = {
    "spine.005": "Hips",
    "spine.004": "Tail_01", "spine.003": "Tail_02", "spine.002": "Tail_03",
    "spine.001": "Tail_04", "spine": "Tail_05",
    "spine.006": "Spine_01", "spine.007": "Spine_02", "spine.008": "Spine_03",
    "spine.009": "Chest", "spine.010": "Withers",
    "spine.011": "Neck_01", "spine.012": "Neck_02", "spine.014": "Neck_03",
    "spine.015": "Neck_04", "spine.016": "Head",
    "skull": "Skull", "skull.L": "Cheek_L", "skull.R": "Cheek_R",
    "jaw": "Jaw", "jaw.001": "Jaw_02",
    "ear.L": "Ear_L_01", "ear.L.001": "Ear_L_02",
    "ear.R": "Ear_R_01", "ear.R.001": "Ear_R_02",
    "shoulder.L": "ForeShoulder_L", "shoulder.R": "ForeShoulder_R",
    "upper_arm.L": "ForeLeg_L_01", "upper_arm.R": "ForeLeg_R_01",
    "forearm.L": "ForeLeg_L_02", "forearm.R": "ForeLeg_R_02",
    "hand.L": "ForeFoot_L", "hand.R": "ForeFoot_R",
    "f_toe.L": "ForeToe_L", "f_toe.R": "ForeToe_R",
    "pelvis.L": "Pelvis_L", "pelvis.R": "Pelvis_R", "pelvis": "Pelvis",
    "thigh.L": "HindLeg_L_01", "thigh.R": "HindLeg_R_01",
    "shin.L": "HindLeg_L_02", "shin.R": "HindLeg_R_02",
    "foot.L": "HindFoot_L", "foot.R": "HindFoot_R",
    "r_toe.L": "HindToe_L", "r_toe.R": "HindToe_R",
    "chest": "Chest_Aux", "belly": "Belly",
}
for old, new in RENAME.items():
    b = arm.data.bones.get(old)
    if b:
        b.name = new
for o in meshes:
    for old, new in RENAME.items():
        vg = o.vertex_groups.get(old)
        if vg:
            vg.name = new
bpy.context.view_layer.update()
bone_names = {b.name for b in arm.data.bones}
for o in meshes:
    stale = sorted({g.name for g in o.vertex_groups} - bone_names)
    print("%-14s vertex groups with no matching bone: %s" % (o.name, stale or "none"))

# --- 7. export ----------------------------------------------------------------
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(os.path.dirname(here), "public", "models", "horse.glb")
os.makedirs(os.path.dirname(out), exist_ok=True)
try:
    bpy.ops.export_scene.gltf(
        filepath=out, export_format="GLB", use_selection=False,
        export_yup=True, export_skins=True, export_animations=False,
        export_apply=False, export_cameras=False, export_lights=False,
        export_extras=False,
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
print("=====HORSE-END=====")

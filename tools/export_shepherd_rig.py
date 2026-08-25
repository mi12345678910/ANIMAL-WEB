# Exports the German Shepherd from "New 3D Dog Model.blend" to
# public/models/dog.glb.
#
# Run:  blender -b "New 3D Dog Model.blend" --python tools/export_shepherd_rig.py
#
# Three things this fixes on the way out, none of which touch the .blend on disk:
#   1. The file has TWO identical 55-bone armatures. The mesh is skinned to
#      "Rig_1 type.001", but the "Idle Breathing" action sits on "Rig_1 type" —
#      so the animation would not play. The action is moved onto the deforming
#      armature and the duplicate is deleted.
#   2. Rigify DEF- bone names are remapped to semantic ones, along with their
#      matching vertex groups, so poses in dog.ts stay readable.
#   3. The base-colour texture is an external file reference; it is packed so
#      the GLB is self-contained.
import bpy, os, traceback

print("=====SHEP-START=====")

DEFORM_ARM = "Rig_1 type.001"   # the one the mesh's Armature modifier points at
SPARE_ARM = "Rig_1 type"        # duplicate that merely holds the action
MESH = "SK_GermanShepherd"

arm = bpy.data.objects[DEFORM_ARM]
spare = bpy.data.objects.get(SPARE_ARM)
mesh = bpy.data.objects[MESH]

# --- 1. move the action onto the armature that actually deforms the mesh -----
action = None
if spare and spare.animation_data and spare.animation_data.action:
    action = spare.animation_data.action
    print("found action on spare armature:", action.name)
if action:
    if not arm.animation_data:
        arm.animation_data_create()
    arm.animation_data.action = action
    # Blender 4.4+ slotted actions: bind the slot too, or the channels
    # resolve to nothing and the exported clip comes out empty.
    try:
        slots = list(action.slots)
        if slots:
            arm.animation_data.action_slot = slots[0]
            print("bound action slot:", slots[0].name_display)
    except Exception as e:
        print("slot binding skipped:", e)
    print("action re-bound to:", arm.name)

# --- 2. pack textures --------------------------------------------------------
for img in bpy.data.images:
    if img.source == 'FILE' and not img.packed_file:
        p = bpy.path.abspath(img.filepath)
        if os.path.exists(p):
            # 2048 RGBA PNG is 7.6 MB in the GLB. Halving it and encoding as
            # WebP keeps the fur-card alpha and drops it to a few hundred KB.
            if max(img.size) > 1024:
                img.scale(1024, 1024)
                print('downscaled', img.name, 'to 1024')
            img.pack()
            print("packed texture:", img.name)
        else:
            print("MISSING texture:", img.name, p)

# --- 2b. give the fur-card material its texture --------------------------
# "M_GermanShepherd_Transparent" (140 tris: the neck ruff / fur cards) ships
# with NO image texture at all - just a flat grey Base Color of (0.8,0.8,0.8),
# which is why those faces render as grey slabs in the browser. This is a
# material problem, not a UV problem: the UVs are fine, there was simply
# nothing to sample. Point it at the same atlas as the body and wire the
# image alpha through so the card silhouettes cut out.
base_img = bpy.data.images.get("T_GermanShepherd_B.png")
if base_img is None:
    for i in bpy.data.images:
        if i.source == "FILE" or i.packed_file:
            base_img = i
            break

def principled(mat):
    for n in mat.node_tree.nodes:
        if n.type == "BSDF_PRINCIPLED":
            return n
    return None

used_mats = [s.material for s in mesh.material_slots if s.material]
for mat in used_mats:
    if not mat.use_nodes:
        continue
    bsdf = principled(mat)
    if bsdf is None or base_img is None:
        continue
    nt = mat.node_tree
    base_in = bsdf.inputs.get("Base Color")
    alpha_in = bsdf.inputs.get("Alpha")
    tex = None
    if base_in is not None and base_in.is_linked:
        src = base_in.links[0].from_node
        if src.type == "TEX_IMAGE":
            tex = src
    if tex is None:
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = base_img
        tex.location = (bsdf.location.x - 400, bsdf.location.y)
        nt.links.new(tex.outputs["Color"], base_in)
        print("attached texture to material:", mat.name)
        # Only the fur cards need cut-out alpha. Leaving the body opaque keeps
        # it cheap and avoids punching holes if any body UV grazes the atlas
        # background.
        if alpha_in is not None:
            nt.links.new(tex.outputs["Alpha"], alpha_in)
        try:
            mat.blend_method = "CLIP"   # exporter maps CLIP -> glTF alphaMode MASK
        except Exception as e:
            print("blend_method not settable:", e)

# --- 3. semantic bone names --------------------------------------------------
# Derived from world-space bone positions: the dog faces -Y, +Z is up.
# Rigify's "DEF-spine/.001/.002/.003" chain runs REARWARD from the hips, so it
# is the tail, not the spine. The forward body chain is .004 -> .006 -> .011.
RENAME = {
    "DEF-spine.004": "Hips",
    "DEF-spine.006": "Spine_01",
    "DEF-spine.007": "Spine_02",
    "DEF-spine.008": "Chest",
    "DEF-spine.009": "Neck_01",
    "DEF-spine.010": "Neck_02",
    "DEF-spine.011": "Head",
    "DEF-jaw": "Jaw",
    "DEF-tongue": "Tongue_01",
    "DEF-tongue.001": "Tongue_02",
    "DEF-tongue.002": "Tongue_03",
    # Only the Border-collie ear01 bones carry vertex weights on this mesh.
    "DEF-Border-collie_ear01.L": "Ear_L_01",
    "DEF-Border-collie_ear02.L": "Ear_L_02",
    "DEF-Border-collie_ear01.R": "Ear_R_01",
    "DEF-Border-collie_ear02.R": "Ear_R_02",
    "DEF-AustralianShepherd_ear01.L": "Ear_L_Alt",
    "DEF-AustralianShepherd_ear01.R": "Ear_R_Alt",
    # Tail, base -> tip.
    "DEF-spine.003": "Tail_01",
    "DEF-spine.002": "Tail_02",
    "DEF-spine.001": "Tail_03",
    "DEF-spine": "Tail_04",
    # Front limbs.
    "DEF-shoulder.L": "ForeShoulder_L", "DEF-shoulder.R": "ForeShoulder_R",
    "DEF-front_thigh.L": "ForeLeg_L_01", "DEF-front_thigh.R": "ForeLeg_R_01",
    "DEF-front_shin.L": "ForeLeg_L_02", "DEF-front_shin.R": "ForeLeg_R_02",
    "DEF-front_foot.L": "ForeFoot_L", "DEF-front_foot.R": "ForeFoot_R",
    "DEF-front_toe.L": "ForeToe_L", "DEF-front_toe.R": "ForeToe_R",
    # Hind limbs.
    "DEF-thigh.L": "HindLeg_L_01", "DEF-thigh.R": "HindLeg_R_01",
    "DEF-shin.L": "HindLeg_L_02", "DEF-shin.R": "HindLeg_R_02",
    "DEF-foot.L": "HindFoot_L", "DEF-foot.R": "HindFoot_R",
    "DEF-toe.L": "HindToe_L", "DEF-toe.R": "HindToe_R",
}
for i in range(1, 5):
    for s in ("L", "R"):
        RENAME["DEF-f_palm.0%d.%s" % (i, s)] = "ForePalm_%s_0%d" % (s, i)
        RENAME["DEF-r_palm.0%d.%s" % (i, s)] = "HindPalm_%s_0%d" % (s, i)

# Rename on BOTH armatures before deleting the spare, so the action's channel
# data paths (which reference bone names) still resolve after the rebind.
for a in [o for o in bpy.data.objects if o.type == 'ARMATURE']:
    for old, new in RENAME.items():
        b = a.data.bones.get(old)
        if b:
            b.name = new
for old, new in RENAME.items():
    vg = mesh.vertex_groups.get(old)
    if vg:
        vg.name = new

leftover = sorted({g.name for g in mesh.vertex_groups} - {b.name for b in arm.data.bones})
print("vertex groups with no matching bone:", leftover)

# --- 4. strip cameras/lights, keep the parent chain -------------------------
if spare and spare is not arm:
    bpy.data.objects.remove(spare, do_unlink=True)
    print("removed duplicate armature")
# Remove ONLY cameras and lights. The mesh/armature sit under empties
# ("Empty_For_Export" / "Group") that carry a 0.01 scale, so deleting those
# parents silently re-scales the rig 100x and the exported GLB comes out
# spanning ~113 units instead of ~1.1.
for o in list(bpy.data.objects):
    if o.type in {'CAMERA', 'LIGHT'}:
        bpy.data.objects.remove(o, do_unlink=True)
for o in bpy.data.objects:
    o.hide_viewport = False
    o.hide_render = False
print("remaining:", [(o.name, o.type) for o in bpy.data.objects])
print("armature has action:", arm.animation_data.action.name if (arm.animation_data and arm.animation_data.action) else None)

# --- 5. export ---------------------------------------------------------------
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(os.path.dirname(here), "public", "models", "dog.glb")
os.makedirs(os.path.dirname(out), exist_ok=True)
scene = bpy.context.scene
scene.frame_start, scene.frame_end = 1, 31
try:
    bpy.ops.export_scene.gltf(
        filepath=out, export_format='GLB', use_selection=False,
        export_yup=True, export_skins=True,
        export_animations=True, export_frame_range=True, export_bake_animation=True,
        # Without these the exporter collapses the 31-key breathing loop down
        # to 2 keyframes and the motion turns into a linear ramp that pops.
        export_force_sampling=True, export_frame_step=1,
        export_optimize_animation_size=False,
        export_apply=False, export_image_format='WEBP', export_image_quality=90,
        export_cameras=False, export_lights=False, export_extras=False,
        export_draco_mesh_compression_enable=False,  # mesh is only 2.2k tris
    )
    print("size KB: %.1f" % (os.path.getsize(out) / 1024))
except Exception:
    traceback.print_exc()
print("=====SHEP-END=====")

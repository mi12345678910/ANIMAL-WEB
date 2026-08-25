# Exports the rigged dog from the source .blend to public/models/dog.glb.
#
# Run:  blender -b "Untitled.blend" --python tools/export_dog_rig.py
#
# The source armature uses generic bone names (Bone.001 ...). This script renames
# bones AND their matching vertex groups to semantic names in memory, then exports
# with Draco compression. The .blend on disk is never modified.

import bpy, traceback, os
print("=====EXP3-START=====")
arm  = bpy.data.objects['Armature']; mesh = bpy.data.objects['geometry_0']
flat = sum(1 for p in mesh.data.polygons if not p.use_smooth)
print("flat-shaded polys: %d / %d" % (flat, len(mesh.data.polygons)))
print("sharp edges:", sum(1 for e in mesh.data.edges if e.use_edge_sharp))
RENAME = {
 'Bone.001':'Spine','Bone.002':'Head','Bone.005':'Muzzle',
 'Bone.006':'Ear_R_01','Bone.028':'Ear_R_02','Bone.030':'Ear_R_03',
 'Bone.007':'Ear_L_01','Bone.027':'Ear_L_02','Bone.029':'Ear_L_03',
 'Bone.016':'ForeLeg_R_01','Bone.022':'ForeLeg_R_02',
 'Bone.017':'ForeLeg_L_01','Bone.021':'ForeLeg_L_02',
 'Bone.019':'HindLeg_R_01','Bone.020':'HindLeg_R_02','Bone':'HindLeg_R_03',
 'Bone.018':'HindLeg_L_01','Bone.025':'HindLeg_L_02','Bone.026':'HindLeg_L_03',
 'Bone.008':'Tail_01','Bone.009':'Tail_02','Bone.010':'Tail_03','Bone.011':'Tail_04',
 'Bone.012':'Tail_05','Bone.013':'Tail_06','Bone.014':'Tail_07','Bone.015':'Tail_08',
 'Bone.023':'Aux_01','Bone.024':'Aux_02',
}
for o,n in RENAME.items():
    if o in arm.data.bones: arm.data.bones[o].name = n
for o,n in RENAME.items():
    vg = mesh.vertex_groups.get(o)
    if vg: vg.name = n
for o in list(bpy.data.objects):
    if o.name not in ('Armature','geometry_0'): bpy.data.objects.remove(o, do_unlink=True)

out = r"C:\Users\hp\Documents\Sublime python\3D Test Model\ANIMAL WEBSITE\public\models\dog.glb"
try:
    bpy.ops.export_scene.gltf(
        filepath=out, export_format='GLB', use_selection=False,
        export_yup=True, export_skins=True, export_animations=False,
        export_apply=False, export_image_format='AUTO',
        export_cameras=False, export_lights=False, export_extras=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12,
        export_draco_generic_quantization=12,
    )
    print("size MB: %.2f" % (os.path.getsize(out)/1048576))
except Exception:
    traceback.print_exc()
print("=====EXP3-END=====")

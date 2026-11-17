func run(api, image, project, params):
	var root=Engine.get_main_loop().root
	var matches=[]
	var source=null
	var active_before=root.get_node("Global").get("current_project")
	for p in root.get_node("Global").get("projects"):
		if p.name=="kitchen-counter-preview" and p.size==Vector2i(176,128):
			matches.append(p)
		if p.name=="kitchen-counter-kit" and p.size==Vector2i(160,160) and p.layers.size()==4:
			source=p
	if matches.size()!=1 or source==null:
		return {"error":"Expected unique intended preview/source"}
	var target=matches[0]
	if target.layers.size()!=1 or target.frames[0].cels[0].get_image().get_used_rect().size!=Vector2i.ZERO:
		return {"error":"Preview must be newly created blank target"}
	var recipe=GDScript.new()
	recipe.source_code="extends RefCounted\n"+FileAccess.get_file_as_string(str(params.source_dir).path_join("compose.gd"))
	if recipe.reload()!=OK: return {"error":"Cannot compile compose recipe"}
	var composer=recipe.new()
	for i in range(2):
		var drawn=composer.call("run",null,null,target,{"role":i,"placements":params.placements,"output_dir":params.output_dir})
		if i==0:
			target.layers[0].name="01 - straight cabinet assemblies"
			target.frames[0].cels[0]=target.layers[0].new_cel_from_image(drawn)
		else:
			var layer=target.layers[0].get_script().new(target,"02 - side and corner assemblies")
			target.layers.append(layer)
			target.frames[0].cels.append(layer.new_cel_from_image(drawn))
	var copy=source.palettes.values()[0].duplicate()
	target.palettes.clear()
	target.palettes["Kitchen counter preview - steel rose chrome"]=copy
	target.fps=1.0
	target.animation_tags.assign([source.animation_tags[0].get_script().new("kitchen-counter-preview-static",Color("#c94d7b"),1,1)])
	var saved=root.get_node("OpenSave").call("save_pxo_file",str(params.source_dir).path_join("kitchen-counter-preview.pxo"),false,target)
	if project==target and image is Image:
		image.copy_from(target.get_current_cel().get_image())
	return {"previewSaved":saved,"size":str(target.size),"layers":target.layers.size(),"activeProjectUnchanged":root.get_node("Global").get("current_project")==active_before}

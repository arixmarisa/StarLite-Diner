func run(api, image, project, params):
	var root=Engine.get_main_loop().root
	var matches=[]
	var active_before=root.get_node("Global").get("current_project")
	for p in root.get_node("Global").get("projects"):
		if p.name=="kitchen-counter-preview" and p.size==Vector2i(176,128) and p.layers.size()==2:
			if p.layers[0].name=="01 - straight cabinet assemblies" and p.layers[1].name=="02 - side and corner assemblies":
				matches.append(p)
	if matches.size()!=1: return {"error":"Ambiguous preview"}
	var target=matches[0]
	var recipe=GDScript.new()
	recipe.source_code="extends RefCounted\n"+FileAccess.get_file_as_string(str(params.source_dir).path_join("compose.gd"))
	if recipe.reload()!=OK: return {"error":"Cannot load compose"}
	var composer=recipe.new()
	for i in range(2):
		var drawn=composer.call("run",null,null,target,{"role":i,"placements":params.placements,"output_dir":params.output_dir})
		target.frames[0].cels[i]=target.layers[i].new_cel_from_image(drawn)
	if project==target and image is Image:
		image.copy_from(target.get_current_cel().get_image())
	var saved=root.get_node("OpenSave").call("save_pxo_file",str(params.source_dir).path_join("kitchen-counter-preview.pxo"),false,target)
	return {"saved":saved,"activeProjectUnchanged":root.get_node("Global").get("current_project")==active_before,"boundImageSynchronizedOnlyForOwnProject":project==target}

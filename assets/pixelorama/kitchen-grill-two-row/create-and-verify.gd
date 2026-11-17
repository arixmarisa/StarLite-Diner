func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var global=root.get_node("Global")
	var active=global.get("current_project")
	var source_dir=str(params.source_dir)
	var output_dir=str(params.output_dir)
	var original=str(params.original_source)
	var source_zip=ZIPReader.new()
	if source_zip.open(original)!=OK:
		return {"error":"Cannot reopen original grill source"}
	var pictures=[]
	var before=Image.create(96,40,false,Image.FORMAT_RGBA8)
	before.fill(Color.TRANSPARENT)
	for index in range(7):
		var bytes=source_zip.read_file("image_data/frames/1/layer_"+str(index+1))
		if bytes.size()!=15360:
			return {"error":"Original cel size differs"}
		var picture=Image.create_from_data(96,40,false,Image.FORMAT_RGBA8,bytes)
		pictures.append(picture)
		before.blend_rect(picture,Rect2i(0,0,96,40),Vector2i.ZERO)
	source_zip.close()
	pictures[3].fill(Color.TRANSPARENT)
	pictures[3].fill_rect(Rect2i(4,6,87,17),Color("#322c38"))
	pictures[3].fill_rect(Rect2i(5,7,85,15),Color("#676c70"))
	pictures[3].fill_rect(Rect2i(5,7,85,1),Color("#46404b"))
	pictures[3].fill_rect(Rect2i(5,8,1,13),Color("#46404b"))
	pictures[3].fill_rect(Rect2i(6,21,83,1),Color("#9ba8a5"))
	pictures[4].fill(Color.TRANSPARENT)
	pictures[4].fill_rect(Rect2i(4,22,87,1),Color("#322c38"))
	pictures[4].fill_rect(Rect2i(5,22,85,1),Color("#46404b"))
	var manifest=JSON.parse_string(FileAccess.get_file_as_string(str(params.original_manifest)))
	var tag_script=null
	for candidate in global.get("projects"):
		if candidate.animation_tags.size()>0:
			tag_script=candidate.animation_tags[0].get_script()
			break
	if tag_script==null:
		return {"error":"Missing native tag prototype"}
	var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"kitchen-grill-two-row",Vector2i(96,40))
	var frame=load("res://src/Classes/Frame.gd").new()
	var complete=Image.create(96,40,false,Image.FORMAT_RGBA8)
	complete.fill(Color.TRANSPARENT)
	var body=complete.duplicate()
	for index in range(7):
		var layer=load("res://src/Classes/Layers/PixelLayer.gd").new(target,str(manifest.layers[index]))
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pictures[index]))
		complete.blend_rect(pictures[index],Rect2i(0,0,96,40),Vector2i.ZERO)
		if index>0:
			body.blend_rect(pictures[index],Rect2i(0,0,96,40),Vector2i.ZERO)
	target.frames.append(frame)
	target.current_frame=0
	target.current_layer=0
	target.fps=1
	frame.duration=1.0
	var swatches=JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var palette=load("res://src/Palette/Palette.gd").new("Original kitchen grill palette",7,2,"Existing14swatches")
	palette.is_project_palette=true
	for swatch in swatches.colors:
		palette.add_color(Color(str(swatch.hex)))
	target.palettes.clear()
	target.palettes["Original kitchen grill palette"]=palette
	target.project_current_palette_name="Original kitchen grill palette"
	target.animation_tags.append(tag_script.new("kitchen-grill-two-row-static",Color("#ee75a3"),1,1))
	var saved=root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("kitchen-grill.pxo"),false,target)
	if not saved:
		return {"error":"Explicit native save failed"}
	complete.save_png(output_dir.path_join("kitchen-grill.png"))
	body.save_png(output_dir.path_join("kitchen-grill-body.png"))
	pictures[0].save_png(output_dir.path_join("kitchen-grill-shadow.png"))
	var enlarged=complete.duplicate()
	enlarged.resize(576,240,Image.INTERPOLATE_NEAREST)
	enlarged.save_png(source_dir.path_join("kitchen-grill-preview.png"))
	var zip=ZIPReader.new()
	if zip.open(source_dir.path_join("kitchen-grill.pxo"))!=OK:
		return {"error":"Cannot independently reopen new source"}
	var rebuilt=Image.create(96,40,false,Image.FORMAT_RGBA8)
	rebuilt.fill(Color.TRANSPARENT)
	for index in range(7):
		var bytes=zip.read_file("image_data/frames/1/layer_"+str(index+1))
		if bytes.size()!=15360:
			return {"error":"Saved native cel length differs"}
		rebuilt.blend_rect(Image.create_from_data(96,40,false,Image.FORMAT_RGBA8,bytes),Rect2i(0,0,96,40),Vector2i.ZERO)
	zip.close()
	var outside=0
	var changed=0
	for yy in range(40):
		for xx in range(96):
			if before.get_pixel(xx,yy)!=complete.get_pixel(xx,yy):
				changed+=1
				if not Rect2i(4,6,87,17).has_point(Vector2i(xx,yy)):
					outside+=1
	var top=Image.load_from_file(str(params.counter_root).path_join("steel-counter-top.png"))
	var front=Image.load_from_file(str(params.counter_root).path_join("steel-counter-front.png"))
	var join_mismatches=0
	for yy in range(31):
		if complete.get_pixel(95,5+yy)!=(top.get_pixel(0,yy) if yy<18 else front.get_pixel(0,yy-18)):
			join_mismatches+=1
	var report={"savedSourceMatchesPng":rebuilt.get_data()==complete.get_data(),"size":[96,40],"layers":7,"paletteSwatches":14,"frames":1,"fps":1,"changedPixels":changed,"changedOutsideCookingSurface":outside,"counterJoinMismatches":join_mismatches,"activeProjectUnchanged":global.get("current_project")==active}
	var file=FileAccess.open(output_dir.path_join("verification.json"),FileAccess.WRITE)
	file.store_string(JSON.stringify(report,"  ")+"\n")
	file.close()
	return report

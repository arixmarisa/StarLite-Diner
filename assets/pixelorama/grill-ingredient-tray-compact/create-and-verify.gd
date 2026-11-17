func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var global=root.get_node("Global")
	var active=global.get("current_project")
	var tag_script=null
	for candidate in global.get("projects"):
		if candidate.animation_tags.size()>0:
			tag_script=candidate.animation_tags[0].get_script()
			break
	if tag_script==null:
		return {"error":"Missing native tag prototype"}
	var source_dir=str(params.source_dir)
	var output_dir=str(params.output_dir)
	var names=["01 - compact contact shadow","02 - narrow steel tray body","03 - chrome rim and reflection"]
	var pictures=[]
	for index in range(3):
		var pic=Image.create(8,14,false,Image.FORMAT_RGBA8)
		pic.fill(Color.TRANSPARENT)
		pictures.append(pic)
	pictures[0].fill_rect(Rect2i(1,12,7,2),Color("#46404b"))
	pictures[1].fill_rect(Rect2i(0,0,8,13),Color("#322c38"))
	pictures[1].fill_rect(Rect2i(1,1,6,11),Color("#d5dfd3"))
	pictures[1].fill_rect(Rect2i(1,11,6,1),Color("#9ba8a5"))
	pictures[2].fill_rect(Rect2i(1,0,6,1),Color("#fff0d5"))
	pictures[2].fill_rect(Rect2i(0,1,1,10),Color("#9ba8a5"))
	pictures[2].fill_rect(Rect2i(1,12,6,1),Color("#676c70"))
	var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"compact-ingredient-tray",Vector2i(8,14))
	var frame=load("res://src/Classes/Frame.gd").new()
	var complete=Image.create(8,14,false,Image.FORMAT_RGBA8)
	complete.fill(Color.TRANSPARENT)
	for index in range(names.size()):
		var layer=load("res://src/Classes/Layers/PixelLayer.gd").new(target,names[index])
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pictures[index]))
		complete.blend_rect(pictures[index],Rect2i(0,0,8,14),Vector2i.ZERO)
	target.frames.append(frame)
	target.current_frame=0
	target.current_layer=0
	target.fps=1
	frame.duration=1.0
	var swatches=JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var palette=load("res://src/Palette/Palette.gd").new("Compact tray original kitchen palette",7,2,"Existing14swatches")
	palette.is_project_palette=true
	for swatch in swatches.colors:
		palette.add_color(Color(str(swatch.hex)))
	target.palettes.clear()
	target.palettes["Compact tray original kitchen palette"]=palette
	target.project_current_palette_name="Compact tray original kitchen palette"
	target.animation_tags.append(tag_script.new("compact-ingredient-tray-static",Color("#ee75a3"),1,1))
	var saved=root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("ingredient-tray.pxo"),false,target)
	if not saved:
		return {"error":"Explicit native save failed"}
	complete.save_png(output_dir.path_join("ingredient-tray.png"))
	var preview=complete.duplicate()
	preview.resize(80,140,Image.INTERPOLATE_NEAREST)
	preview.save_png(source_dir.path_join("ingredient-tray-preview.png"))
	var zip=ZIPReader.new()
	if zip.open(source_dir.path_join("ingredient-tray.pxo"))!=OK:
		return {"error":"Cannot independently reopen saved tray"}
	var rebuilt=Image.create(8,14,false,Image.FORMAT_RGBA8)
	rebuilt.fill(Color.TRANSPARENT)
	for index in range(names.size()):
		var bytes=zip.read_file("image_data/frames/1/layer_"+str(index+1))
		if bytes.size()!=448:
			return {"error":"Wrong native cel size"}
		rebuilt.blend_rect(Image.create_from_data(8,14,false,Image.FORMAT_RGBA8,bytes),Rect2i(0,0,8,14),Vector2i.ZERO)
	zip.close()
	var report={"savedSourceMatchesPng":rebuilt.get_data()==complete.get_data(),"size":[8,14],"layers":3,"paletteSwatches":14,"frames":1,"fps":1,"activeProjectUnchanged":global.get("current_project")==active}
	var file=FileAccess.open(output_dir.path_join("verification.json"),FileAccess.WRITE)
	file.store_string(JSON.stringify(report,"  ")+"\n")
	file.close()
	return report

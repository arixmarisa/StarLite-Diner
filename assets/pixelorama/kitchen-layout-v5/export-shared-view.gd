func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var global=root.get_node("Global")
	var active=global.get("current_project")
	var source_dir=str(params.source_dir)
	var output_dir=str(params.output_dir)
	var layout=JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("placements.json")))
	var view=layout.stationViews.grill.viewport
	var crop=Rect2i(int(view.x),int(view.y),int(view.width),int(view.height))
	var zip=ZIPReader.new()
	if zip.open(source_dir.path_join("kitchen-layout.pxo"))!=OK:
		return {"error":"Cannot reopen actual kitchen source"}
	var tag_script=null
	for candidate in global.get("projects"):
		if candidate.animation_tags.size()>0:
			tag_script=candidate.animation_tags[0].get_script()
			break
	if tag_script==null:
		return {"error":"No native tag prototype available"}
	var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"shared-kitchen-grill-view",crop.size)
	var frame=load("res://src/Classes/Frame.gd").new()
	var complete=Image.create(crop.size.x,crop.size.y,false,Image.FORMAT_RGBA8)
	complete.fill(Color.TRANSPARENT)
	for index in range(layout.layers.size()):
		var bytes=zip.read_file("image_data/frames/1/layer_"+str(index+1))
		if bytes.size()!=384*304*4:
			return {"error":"Unexpected room cel size"}
		var room_picture=Image.create_from_data(384,304,false,Image.FORMAT_RGBA8,bytes)
		var picture=room_picture.get_region(crop)
		var layer=load("res://src/Classes/Layers/PixelLayer.gd").new(target,str(layout.layers[index]))
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(picture))
		complete.blend_rect(picture,Rect2i(Vector2i.ZERO,crop.size),Vector2i.ZERO)
	zip.close()
	target.frames.append(frame)
	target.current_frame=0
	target.current_layer=0
	target.fps=1
	frame.duration=1.0
	var swatches=JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var palette=load("res://src/Palette/Palette.gd").new("Shared kitchen view",7,3,"Existing kitchen colors; derived actual-room crop")
	palette.is_project_palette=true
	for swatch in swatches.colors:
		palette.add_color(Color(str(swatch.hex)))
	target.palettes.clear()
	target.palettes["Shared kitchen view"]=palette
	target.project_current_palette_name="Shared kitchen view"
	target.animation_tags.append(tag_script.new("shared-kitchen-grill-view-static",Color("#ee75a3"),1,1))
	var saved=root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("grill-station-view.pxo"),false,target)
	if not saved:
		return {"error":"Targeted native save failed"}
	complete.save_png(output_dir.path_join("grill-station-view.png"))
	var enlarged=complete.duplicate()
	enlarged.resize(crop.size.x*9,crop.size.y*9,Image.INTERPOLATE_NEAREST)
	enlarged.save_png(source_dir.path_join("grill-station-view-preview.png"))
	enlarged.save_png(output_dir.path_join("grill-station-view-preview.png"))
	var room=Image.load_from_file(output_dir.path_join("kitchen-layout.png"))
	var saved_zip=ZIPReader.new()
	if saved_zip.open(source_dir.path_join("grill-station-view.pxo"))!=OK:
		return {"error":"Cannot reopen saved view"}
	var rebuilt=Image.create(crop.size.x,crop.size.y,false,Image.FORMAT_RGBA8)
	rebuilt.fill(Color.TRANSPARENT)
	for index in range(layout.layers.size()):
		var bytes=saved_zip.read_file("image_data/frames/1/layer_"+str(index+1))
		if bytes.size()!=crop.size.x*crop.size.y*4:
			return {"error":"View cel size differs"}
		var picture=Image.create_from_data(crop.size.x,crop.size.y,false,Image.FORMAT_RGBA8,bytes)
		rebuilt.blend_rect(picture,Rect2i(Vector2i.ZERO,crop.size),Vector2i.ZERO)
	saved_zip.close()
	var report={"source":"kitchen-layout.pxo","viewSource":"grill-station-view.pxo","viewport":view,"savedSourceMatchesPng":rebuilt.get_data()==complete.get_data(),"viewExactlyMatchesKitchenCrop":complete.get_data()==room.get_region(crop).get_data(),"layers":layout.layers.size(),"paletteSwatches":swatches.colors.size(),"frameCount":1,"fps":1,"ingredients":layout.stationViews.grill.ingredients,"activeProjectUnchanged":global.get("current_project")==active}
	var file=FileAccess.open(output_dir.path_join("grill-view-verification.json"),FileAccess.WRITE)
	file.store_string(JSON.stringify(report,"  ")+"\n")
	file.close()
	return report

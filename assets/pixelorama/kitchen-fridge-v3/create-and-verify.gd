const W = 40
const H = 60
const NAMES = ["01 - contact shadow","02 - compact cabinet plinth and feet","03 - stainless overhead top","04 - closed steel door planes","05 - recessed handles and vent","06 - rose badge and hard reflections"]

func blank():
	var pic = Image.create(W,H,false,Image.FORMAT_RGBA8)
	pic.fill(Color(0,0,0,0))
	return pic

func box(pic,x,y,w,h,color):
	pic.fill_rect(Rect2i(x,y,w,h),Color(color))

func run(api,image,project,params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	var tag_script = null
	for candidate in global.get("projects"):
		if candidate.animation_tags.size()>0:
			tag_script = candidate.animation_tags[0].get_script()
			break
	if tag_script == null:
		return {"error":"No native static-tag prototype"}
	var pics = []
	for role in range(6):
		pics.append(blank())
	box(pics[0],6,52,30,3,"#46404b")
	box(pics[0],5,53,32,1,"#46404b")
	box(pics[1],4,5,32,46,"#322c38")
	box(pics[1],5,6,30,44,"#676c70")
	for xx in [7,29]:
		box(pics[1],xx,50,4,3,"#322c38")
		box(pics[1],xx+1,50,2,2,"#676c70")
	box(pics[2],4,5,32,18,"#322c38")
	box(pics[2],5,6,30,16,"#9ba8a5")
	box(pics[2],5,6,30,1,"#d5dfd3")
	box(pics[2],5,7,1,14,"#d5dfd3")
	box(pics[2],6,7,11,1,"#d5dfd3")
	box(pics[2],5,21,30,1,"#676c70")
	box(pics[3],5,23,30,26,"#322c38")
	box(pics[3],6,24,13,24,"#9ba8a5")
	box(pics[3],21,24,13,24,"#9ba8a5")
	box(pics[3],6,24,13,1,"#d5dfd3")
	box(pics[3],21,24,13,1,"#d5dfd3")
	box(pics[3],6,25,1,22,"#d5dfd3")
	box(pics[3],21,25,1,22,"#d5dfd3")
	box(pics[3],18,25,1,23,"#676c70")
	box(pics[3],33,25,1,23,"#676c70")
	box(pics[3],5,49,30,1,"#676c70")
	for xx in [15,23]:
		box(pics[4],xx,31,3,11,"#322c38")
		box(pics[4],xx+1,31,1,10,"#d5dfd3")
	for xx in [11,15,19,23,27]:
		box(pics[4],xx,49,2,1,"#322c38")
	box(pics[5],29,27,3,1,"#ee75a3")
	box(pics[5],7,8,6,1,"#d5dfd3")
	box(pics[5],7,46,4,1,"#d5dfd3")
	box(pics[5],22,46,4,1,"#d5dfd3")
	var target = load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"kitchen-fridge-v3",Vector2i(W,H))
	var frame = load("res://src/Classes/Frame.gd").new()
	var complete = blank()
	var body = blank()
	for role in range(6):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target,NAMES[role])
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pics[role]))
		complete.blend_rect(pics[role],Rect2i(0,0,W,H),Vector2i.ZERO)
		if role>0:
			body.blend_rect(pics[role],Rect2i(0,0,W,H),Vector2i.ZERO)
	target.frames.append(frame)
	target.current_frame = 0
	target.current_layer = 0
	target.fps = 1
	frame.duration = 1.0
	var swatches = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var palette = load("res://src/Palette/Palette.gd").new("Compact fridge approved kitchen palette",7,2,"Original fourteen swatches")
	palette.is_project_palette = true
	for swatch in swatches.colors:
		palette.add_color(Color(str(swatch.hex)))
	target.palettes.clear()
	target.palettes["Compact fridge approved kitchen palette"] = palette
	target.project_current_palette_name = "Compact fridge approved kitchen palette"
	target.animation_tags.append(tag_script.new("kitchen-fridge-v3-static",Color("#ee75a3"),1,1))
	var saved = root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("kitchen-fridge.pxo"),false,target)
	if not saved:
		return {"error":"Native explicit target save failed"}
	for entry in [["kitchen-fridge.png",complete],["kitchen-fridge-atlas.png",complete],["kitchen-fridge-body.png",body],["kitchen-fridge-shadow.png",pics[0]]]:
		if entry[1].save_png(output_dir.path_join(entry[0])) != OK:
			return {"error":"PNG export failed", "file":entry[0]}
	var preview = complete.duplicate()
	preview.resize(W*6,H*6,Image.INTERPOLATE_NEAREST)
	preview.save_png(source_dir.path_join("kitchen-fridge-preview.png"))
	preview.save_png(output_dir.path_join("kitchen-fridge-preview.png"))
	var zip = ZIPReader.new()
	if zip.open(source_dir.path_join("kitchen-fridge.pxo")) != OK:
		return {"error":"Saved source ZIP reopen failed"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var rebuilt = blank()
	var byte_sizes = []
	var populated = 0
	for role in range(6):
		var raw = zip.read_file("image_data/frames/1/layer_"+str(role+1))
		byte_sizes.append(raw.size())
		if raw.size() != W*H*4:
			return {"error":"Saved cel dimensions differ", "layer":role}
		var cel = Image.create_from_data(W,H,false,Image.FORMAT_RGBA8,raw)
		if cel.get_used_rect().has_area():
			populated += 1
		rebuilt.blend_rect(cel,Rect2i(0,0,W,H),Vector2i.ZERO)
	zip.close()
	var reconstructed = pics[0].duplicate()
	reconstructed.blend_rect(body,Rect2i(0,0,W,H),Vector2i.ZERO)
	var opaque = 0
	var semi = 0
	var orphans = 0
	var colors = {}
	for yy in range(H):
		for xx in range(W):
			var color = complete.get_pixel(xx,yy)
			if color.a==0:
				continue
			colors[color.to_html()] = true
			opaque += int(color.a==1)
			semi += int(color.a<1)
			var adjacent = false
			for delta in [Vector2i.LEFT,Vector2i.RIGHT,Vector2i.UP,Vector2i.DOWN]:
				var point = Vector2i(xx,yy)+delta
				if Rect2i(0,0,W,H).has_point(point) and complete.get_pixelv(point).a>0:
					adjacent = true
			orphans += int(not adjacent)
	var bounds = complete.get_used_rect()
	var report = {"sourceSize":[data.size_x,data.size_y],"sourceLayers":data.layers.size(),"populatedLayers":populated,"celByteSizes":byte_sizes,"frames":data.frames.size(),"fps":data.fps,"tag":data.tags[0].name,"paletteSwatches":JSON.parse_string(data.palettes[0].values()[0]).colors.size(),"sourcePixelsMatchNativePng":rebuilt.get_data()==Image.load_from_file(output_dir.path_join("kitchen-fridge.png")).get_data(),"componentsReconstructExactly":reconstructed.get_data()==complete.get_data(),"opaquePixels":opaque,"semitransparentPixels":semi,"orphanPixels":orphans,"visibleColors":colors.size(),"occupiedBounds":{"x":bounds.position.x,"y":bounds.position.y,"width":bounds.size.x,"height":bounds.size.y},"floorContactAnchor":[20,52],"activeProjectUnchanged":global.get("current_project")==active_before}
	var file = FileAccess.open(output_dir.path_join("verification.json"),FileAccess.WRITE)
	file.store_string(JSON.stringify(report,"  ")+"\n")
	file.close()
	return report

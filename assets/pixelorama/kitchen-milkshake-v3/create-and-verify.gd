const W = 20
const H = 34
const LAYERS = ["01 - counter contact shadow", "02 - steel column and oval base", "03 - chrome motor and rose band", "04 - mixing spindle", "05 - open steel mixing cup", "06 - control and hard reflections"]

func combine(target, indices):
	var output = Image.create(W,H,false,Image.FORMAT_RGBA8)
	output.fill(Color(0,0,0,0))
	for index in indices:
		output.blend_rect(target.frames[0].cels[index].get_image(),Rect2i(0,0,W,H),Vector2i.ZERO)
	return output

func run(api, image, project, params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	var prototype = null
	for candidate in global.get("projects"):
		if candidate.palettes.size() > 0 and candidate.animation_tags.size() > 0 and JSON.parse_string(candidate.palettes.values()[0].serialize()).colors.size() == 14:
			prototype = candidate
			break
	if prototype == null:
		return {"error":"No existing approved 14-swatch palette/tag prototype"}
	var target = load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"kitchen-milkshake-v3",Vector2i(W,H))
	var frame = load("res://src/Classes/Frame.gd").new()
	var generator = GDScript.new()
	generator.source_code = "extends RefCounted\n" + FileAccess.get_file_as_string(source_dir.path_join("draw.gd"))
	if generator.reload() != OK:
		return {"error":"Recipe failed compilation"}
	var drawer = generator.new()
	for role in range(LAYERS.size()):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target,LAYERS[role])
		var pixels = drawer.call("run",null,null,target,{"role":role})
		if not pixels is Image or pixels.get_size() != Vector2i(W,H):
			return {"error":"Wrong generated cel geometry"}
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pixels))
	target.frames.append(frame)
	target.current_frame = 0
	target.current_layer = 0
	target.fps = 1
	target.frames[0].duration = 1.0
	target.palettes.clear()
	target.palettes["Milkshake maker - approved rose cream chrome"] = prototype.palettes.values()[0].duplicate()
	target.animation_tags.append(prototype.animation_tags[0].get_script().new("kitchen-milkshake-v3-static",Color("#ee75a3"),1,1))
	var complete = combine(target,[0,1,2,3,4,5])
	var body = combine(target,[1,2,3,4,5])
	var shadow = combine(target,[0])
	var saved = root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("kitchen-milkshake.pxo"),false,target)
	if not saved:
		return {"error":"Explicit private-project save failed"}
	var codes = {}
	for entry in [["kitchen-milkshake.png",complete],["kitchen-milkshake-body.png",body],["kitchen-milkshake-shadow.png",shadow],["kitchen-milkshake-atlas.png",complete]]:
		codes[entry[0]] = entry[1].save_png(output_dir.path_join(entry[0]))
	var preview = complete.duplicate()
	preview.resize(W*6,H*6,Image.INTERPOLATE_NEAREST)
	codes["preview"] = preview.save_png(source_dir.path_join("kitchen-milkshake-preview.png"))
	preview.save_png(output_dir.path_join("kitchen-milkshake-preview.png"))
	var zip = ZIPReader.new()
	if zip.open(source_dir.path_join("kitchen-milkshake.pxo")) != OK:
		return {"error":"Cannot reopen saved ZIP"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened = Image.create(W,H,false,Image.FORMAT_RGBA8)
	reopened.fill(Color(0,0,0,0))
	var populated = []
	for role in range(LAYERS.size()):
		var raw = zip.read_file("image_data/frames/1/layer_"+str(role+1))
		if raw.size() != W*H*4:
			return {"error":"Saved source cel has wrong byte size"}
		var cel = Image.create_from_data(W,H,false,Image.FORMAT_RGBA8,raw)
		populated.append(cel.get_used_rect().has_area())
		reopened.blend_rect(cel,Rect2i(0,0,W,H),Vector2i.ZERO)
	zip.close()
	var native = Image.load_from_file(output_dir.path_join("kitchen-milkshake.png"))
	var rebuilt = shadow.duplicate()
	rebuilt.blend_rect(body,Rect2i(0,0,W,H),Vector2i.ZERO)
	var colors = {}
	var opaque = 0
	var semi = 0
	var orphan = 0
	for y in range(H):
		for x in range(W):
			var color = complete.get_pixel(x,y)
			if color.a == 0:
				continue
			colors[color.to_html()] = true
			if color.a == 1:
				opaque += 1
			else:
				semi += 1
			var neighbors = 0
			for dy in range(-1,2):
				for dx in range(-1,2):
					if (dx != 0 or dy != 0) and x+dx >= 0 and x+dx < W and y+dy >= 0 and y+dy < H and complete.get_pixel(x+dx,y+dy).a > 0:
						neighbors += 1
			if neighbors == 0:
				orphan += 1
	var bounds = complete.get_used_rect()
	var result = {"saved":saved,"nativeSize":[data.size_x,data.size_y],"sourceLayers":data.layers.size(),"populatedLayers":populated,"paletteSwatches":JSON.parse_string(data.palettes[0].values()[0]).colors.size(),"frames":data.frames.size(),"fps":data.fps,"duration":data.frames[0].duration,"tag":data.tags[0].name,"savedSourceMatchesNativePng":reopened.get_data()==native.get_data(),"componentsReconstructExactly":rebuilt.get_data()==native.get_data(),"activeProjectUnchanged":global.get("current_project")==active_before,"exportCodes":codes,"opaquePixels":opaque,"semitransparentPixels":semi,"visibleColors":colors.size(),"orphanPixels":orphan,"occupiedBounds":{"x":bounds.position.x,"y":bounds.position.y,"width":bounds.size.x,"height":bounds.size.y}}
	var report = FileAccess.open(output_dir.path_join("verification.json"),FileAccess.WRITE)
	report.store_string(JSON.stringify(result,"  ")+"\n")
	report.close()
	return result

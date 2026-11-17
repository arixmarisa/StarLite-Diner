const W = 48
const H = 72
const LAYERS = ["01 - contact shadow","02 - steel cabinet plinth and feet","03 - top surround dark oil well and splash","04 - empty wire basket","05 - west projecting basket handle","06 - controls recessed handle and vents","07 - hard chrome reflections"]

func blend_layers(target, indices):
	var output = Image.create(W, H, false, Image.FORMAT_RGBA8)
	output.fill(Color(0, 0, 0, 0))
	for index in indices:
		output.blend_rect(target.frames[0].cels[index].get_image(), Rect2i(0, 0, W, H), Vector2i.ZERO)
	return output

func sprite_qa(picture):
	var histogram = {}
	var opaque = 0
	var semi = 0
	var orphans = 0
	for y in range(H):
		for x in range(W):
			var color = picture.get_pixel(x, y)
			if color.a > 0:
				histogram[color.to_html()] = true
				if color.a == 1:
					opaque += 1
				else:
					semi += 1
				var neighbor = false
				for dy in range(-1, 2):
					for dx in range(-1, 2):
						var xx = x + dx
						var yy = y + dy
						if (dx != 0 or dy != 0) and xx >= 0 and yy >= 0 and xx < W and yy < H and picture.get_pixel(xx, yy).a > 0:
							neighbor = true
				if not neighbor:
					orphans += 1
	var visited = {}
	var holes = []
	for y in range(H):
		for x in range(W):
			var key = y * W + x
			if visited.has(key) or picture.get_pixel(x, y).a > 0:
				continue
			var queue = [Vector2i(x, y)]
			visited[key] = true
			var boundary = false
			var head = 0
			while head < queue.size():
				var point = queue[head]
				head += 1
				if point.x == 0 or point.y == 0 or point.x == W - 1 or point.y == H - 1:
					boundary = true
				for offset in [Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP, Vector2i.DOWN]:
					var next = point + offset
					if next.x < 0 or next.y < 0 or next.x >= W or next.y >= H:
						continue
					var next_key = next.y * W + next.x
					if not visited.has(next_key) and picture.get_pixel(next.x, next.y).a == 0:
						visited[next_key] = true
						queue.append(next)
			if not boundary:
				holes.append(queue.size())
	var bounds = picture.get_used_rect()
	return {"opaquePixels": opaque, "semitransparentPixels": semi, "visibleColors": histogram.size(), "orphans": orphans, "holes": holes, "bounds": {"x": bounds.position.x, "y": bounds.position.y, "width": bounds.size.x, "height": bounds.size.y}}

func run(api, image, project, params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	var spec = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("rectangles.json")))
	var prototype = null
	for candidate in global.get("projects"):
		if candidate.name == "back-grill" and candidate.size == Vector2i(96,64) and candidate.layers.size() == 7 and candidate.palettes.size() > 0 and candidate.animation_tags.size() > 0:
			if JSON.parse_string(candidate.palettes.values()[0].serialize()).colors.size() == 14:
				prototype = candidate
				break
	if prototype == null:
		return {"error":"Approved original palette/tag prototype unavailable"}
	var target = load("res://src/Classes/Project.gd").new(Array([], TYPE_OBJECT, "RefCounted", load("res://src/Classes/Frame.gd")), "kitchen-fryer", Vector2i(W,H))
	if target.frames.size() != 0 or target.layers.size() != 0:
		return {"error":"Expected an empty private native project"}
	var frame = load("res://src/Classes/Frame.gd").new()
	var generator = GDScript.new()
	generator.source_code = "extends RefCounted\n" + FileAccess.get_file_as_string(source_dir.path_join("draw.gd"))
	if generator.reload() != OK:
		return {"error":"Drawing recipe compilation failed"}
	var drawer = generator.new()
	for role in range(7):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target, LAYERS[role])
		var drawn = drawer.call("run", null, null, target, {"rectangles":spec.layers[role]})
		if not drawn is Image or drawn.get_size() != Vector2i(W,H):
			return {"error":"Wrong native cel size","role":role}
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(drawn))
	target.frames.append(frame)
	target.current_frame = 0
	target.current_layer = 0
	target.fps = 1
	target.frames[0].duration = 1.0
	target.palettes.clear()
	target.palettes["Kitchen fryer - approved rose cream chrome"] = prototype.palettes.values()[0].duplicate()
	target.animation_tags.append(prototype.animation_tags[0].get_script().new("kitchen-fryer-static",Color("#ee75a3"),1,1))
	var complete = blend_layers(target,[0,1,2,3,4,5,6])
	var shadow = blend_layers(target,[0])
	var body = blend_layers(target,[1,2,3,4,5,6])
	var saved = root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("kitchen-fryer.pxo"),false,target)
	if not saved:
		return {"error":"Explicit-project native save failed"}
	var codes = {}
	for entry in [["kitchen-fryer.png",complete],["kitchen-fryer-body.png",body],["kitchen-fryer-shadow.png",shadow],["kitchen-fryer-atlas.png",complete]]:
		codes[entry[0]] = entry[1].save_png(output_dir.path_join(entry[0]))
	var preview = complete.duplicate()
	preview.resize(W*6,H*6,Image.INTERPOLATE_NEAREST)
	codes["preview"] = preview.save_png(source_dir.path_join("kitchen-fryer-preview.png"))
	var atlas = {"frames":{"kitchen-fryer_0":{"frame":{"x":0,"y":0,"w":W,"h":H},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":W,"h":H},"sourceSize":{"w":W,"h":H},"duration":1000}},"meta":{"app":"Pixelorama MCP native project export","format":"RGBA8888","image":"kitchen-fryer-atlas.png","scale":"1","size":{"w":W,"h":H},"frameTags":[{"name":"kitchen-fryer-static","from":0,"to":0,"direction":"forward","color":"ee75a3ff"}]}}
	var atlas_file = FileAccess.open(output_dir.path_join("kitchen-fryer-atlas.json"),FileAccess.WRITE)
	atlas_file.store_string(JSON.stringify(atlas,"  ")+"\n")
	atlas_file.close()
	var zip = ZIPReader.new()
	if zip.open(source_dir.path_join("kitchen-fryer.pxo")) != OK:
		return {"error":"Cannot reopen native source ZIP"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened = Image.create(W,H,false,Image.FORMAT_RGBA8)
	reopened.fill(Color(0,0,0,0))
	var populated = []
	var cel_sizes = []
	for role in range(7):
		var raw = zip.read_file("image_data/frames/1/layer_"+str(role+1))
		cel_sizes.append(raw.size())
		if raw.size() != W*H*4:
			return {"error":"Wrong saved RGBA cel length","role":role}
		var cel_image = Image.create_from_data(W,H,false,Image.FORMAT_RGBA8,raw)
		populated.append(cel_image.get_used_rect().has_area())
		reopened.blend_rect(cel_image,Rect2i(0,0,W,H),Vector2i.ZERO)
	zip.close()
	var native = Image.load_from_file(output_dir.path_join("kitchen-fryer.png"))
	var rebuilt = shadow.duplicate()
	rebuilt.blend_rect(body,Rect2i(0,0,W,H),Vector2i.ZERO)
	var palette_data = JSON.parse_string(data.palettes[0].values()[0])
	var result = sprite_qa(complete)
	result.merge({"saved":saved,"sourceSize":[data.size_x,data.size_y],"sourceLayers":data.layers.size(),"populatedLayers":populated,"celByteSizes":cel_sizes,"frames":data.frames.size(),"fps":data.fps,"frameDuration":data.frames[0].duration,"paletteSwatches":palette_data.colors.size(),"tag":data.tags[0].name,"sourcePixelsMatchNativePng":reopened.get_data()==native.get_data(),"componentsReconstructExactly":rebuilt.get_data()==native.get_data(),"activeProjectUnchanged":global.get("current_project")==active_before,"exportCodes":codes,"handlePointsWest":complete.get_pixel(6,23).a==1 and complete.get_pixel(12,23).a==1})
	var report = FileAccess.open(output_dir.path_join("verification.json"),FileAccess.WRITE)
	report.store_string(JSON.stringify(result,"  ")+"\n")
	report.close()
	return result

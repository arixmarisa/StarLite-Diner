func same_names(target, names):
	if target.layers.size() != names.size():
		return false
	for index in range(names.size()):
		if target.layers[index].name != names[index]:
			return false
	return true

func combine(target, indices):
	var output = Image.create(48, 80, false, Image.FORMAT_RGBA8)
	output.fill(Color(0, 0, 0, 0))
	for index in indices:
		output.blend_rect(target.frames[0].cels[index].get_image(), Rect2i(0, 0, 48, 80), Vector2i.ZERO)
	return output

func transparent_regions(picture):
	var visited = {}
	var holes = []
	for start_y in range(80):
		for start_x in range(48):
			var start = Vector2i(start_x,start_y)
			if visited.has(start) or picture.get_pixelv(start).a > 0.0:
				continue
			var stack = [start]
			visited[start] = true
			var count = 0
			var touches_border = false
			var minimum = start
			var maximum = start
			while not stack.is_empty():
				var point = stack.pop_back()
				count += 1
				minimum.x = mini(minimum.x,point.x)
				minimum.y = mini(minimum.y,point.y)
				maximum.x = maxi(maximum.x,point.x)
				maximum.y = maxi(maximum.y,point.y)
				if point.x == 0 or point.x == 47 or point.y == 0 or point.y == 79:
					touches_border = true
				for delta in [Vector2i(-1,0),Vector2i(1,0),Vector2i(0,-1),Vector2i(0,1)]:
					var neighbor = point + delta
					if neighbor.x < 0 or neighbor.x >= 48 or neighbor.y < 0 or neighbor.y >= 80 or visited.has(neighbor):
						continue
					if picture.get_pixelv(neighbor).a == 0.0:
						visited[neighbor] = true
						stack.append(neighbor)
			if not touches_border:
				holes.append({"pixels":count,"bounds":{"x":minimum.x,"y":minimum.y,"width":maximum.x-minimum.x+1,"height":maximum.y-minimum.y+1}})
	return holes

func stats(picture):
	var opaque = 0
	var semi = 0
	var colors = {}
	var orphan = 0
	for y in range(80):
		for x in range(48):
			var color = picture.get_pixel(x, y)
			if color.a <= 0.0:
				continue
			if color.a == 1.0:
				opaque += 1
			else:
				semi += 1
			colors[color.to_html()] = true
			var neighbors = 0
			for dy in range(-1, 2):
				for dx in range(-1, 2):
					if dx == 0 and dy == 0:
						continue
					if x + dx >= 0 and x + dx < 48 and y + dy >= 0 and y + dy < 80 and picture.get_pixel(x + dx, y + dy).a > 0.0:
						neighbors += 1
			if neighbors == 0:
				orphan += 1
	var bounds = picture.get_used_rect()
	return {"opaquePixels":opaque, "semitransparentPixels":semi, "visibleColors":colors.size(), "orphans":orphan, "enclosedTransparentRegions":transparent_regions(picture), "occupiedBounds":{"x":bounds.position.x,"y":bounds.position.y,"width":bounds.size.x,"height":bounds.size.y}}

func run(api, image, project, params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var spec = JSON.parse_string(FileAccess.get_file_as_string(str(params.source_dir).path_join("rectangles.json")))
	var targets = []
	var prototype = null
	for candidate in global.get("projects"):
		if candidate.name == "kitchen-fridge" and candidate.size == Vector2i(48, 80):
			targets.append(candidate)
		if candidate.name == "back-grill" and candidate.size == Vector2i(96, 64) and candidate.layers.size() == 7 and candidate.palettes.size() > 0 and candidate.animation_tags.size() > 0:
			prototype = candidate
	if targets.size() != 1:
		return {"error":"Expected one uniquely named48x80 kitchen-fridge project", "matches":targets.size()}
	var target = targets[0]
	var active_before = global.get("current_project")
	if bool(params.get("setup", false)):
		if target.frames.size() != 1 or target.layers.size() != 1 or target.frames[0].cels[0].get_image().get_used_rect().has_area():
			return {"error":"New fridge target is not one blank frame/layer; no setup performed"}
		if prototype == null:
			return {"error":"Open approved back-grill source for palette/type prototypes; no setup performed"}
		if JSON.parse_string(prototype.palettes.values()[0].serialize()).colors.size() != 14:
			return {"error":"Approved palette prototype does not contain14swatches; no setup performed"}
		var layer_script = target.layers[0].get_script()
		var blank = Image.create(48, 80, false, Image.FORMAT_RGBA8)
		blank.fill(Color(0, 0, 0, 0))
		target.layers[0].name = str(spec.layerNames[0])
		target.frames[0].cels[0] = target.layers[0].new_cel_from_image(blank)
		for index in range(1,6):
			var layer = layer_script.new(target, str(spec.layerNames[index]))
			target.layers.append(layer)
			target.frames[0].cels.append(layer.new_cel_from_image(blank.duplicate()))
		var palette = prototype.palettes.values()[0].duplicate()
		target.palettes.clear()
		target.palettes["Kitchen fridge - approved rose cream chrome"] = palette
		target.fps = 1.0
		target.frames[0].duration = 1.0
		var tag_script = prototype.animation_tags[0].get_script()
		target.animation_tags.clear()
		target.animation_tags.append(tag_script.new("kitchen-fridge-static", Color("#9ba8a5"), 1, 1))
	if not same_names(target, spec.layerNames) or target.frames.size() != 1:
		return {"error":"Target layer/frame identity differs; no draw/save performed"}
	if bool(params.get("render", false)):
		var generator = GDScript.new()
		generator.source_code = "extends RefCounted\n" + FileAccess.get_file_as_string(str(params.source_dir).path_join("draw.gd"))
		if generator.reload() != OK:
			return {"error":"Drawing recipe compilation failed"}
		var renderer = generator.new()
		for role in range(6):
			var drawn = renderer.call("run", null, null, target, {"rectangles":spec.layers[role]})
			if not drawn is Image or drawn.get_size() != Vector2i(48, 80):
				return {"error":"Drawing recipe returned wrong size", "role":role}
			target.frames[0].cels[role] = target.layers[role].new_cel_from_image(drawn)
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	DirAccess.make_dir_recursive_absolute(source_dir)
	DirAccess.make_dir_recursive_absolute(output_dir)
	var composite = combine(target, [0,1,2,3,4,5])
	var body = combine(target, [1,2,3,4,5])
	var shadow = combine(target, [0])
	var rebuilt = shadow.duplicate()
	rebuilt.blend_rect(body, Rect2i(0,0,48,80), Vector2i.ZERO)
	var saved = root.get_node("OpenSave").call("save_pxo_file", source_dir.path_join("kitchen-fridge.pxo"), false, target)
	if not saved:
		return {"error":"Targeted native save failed"}
	var exports = {}
	for entry in [["kitchen-fridge.png",composite],["kitchen-fridge-body.png",body],["kitchen-fridge-shadow.png",shadow],["kitchen-fridge-atlas.png",composite]]:
		exports[entry[0]] = entry[1].save_png(output_dir.path_join(entry[0]))
	var preview = composite.duplicate()
	preview.resize(288,480,Image.INTERPOLATE_NEAREST)
	exports["kitchen-fridge-preview.png"] = preview.save_png(source_dir.path_join("kitchen-fridge-preview.png"))
	var zip = ZIPReader.new()
	if zip.open(source_dir.path_join("kitchen-fridge.pxo")) != OK:
		return {"error":"Cannot reopen source ZIP after save"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened = Image.create(48,80,false,Image.FORMAT_RGBA8)
	reopened.fill(Color(0,0,0,0))
	var populated = []
	for role in range(6):
		var raw = zip.read_file("image_data/frames/1/layer_" + str(role+1))
		var cel_image = Image.create_from_data(48,80,false,Image.FORMAT_RGBA8,raw)
		reopened.blend_rect(cel_image,Rect2i(0,0,48,80),Vector2i.ZERO)
		populated.append(cel_image.get_used_rect().has_area())
	zip.close()
	var palette_data = JSON.parse_string(data.palettes[0].values()[0])
	var exported_png = Image.load_from_file(output_dir.path_join("kitchen-fridge.png"))
	var result = stats(composite)
	result["reopenedSourceMatchesNativePng"] = reopened.get_data() == exported_png.get_data()
	result["componentsReconstructExactly"] = rebuilt.get_data() == composite.get_data()
	result["sourceSize"] = [data.size_x,data.size_y]
	result["populatedLayers"] = populated
	result["paletteSwatches"] = palette_data.colors.size()
	result["frameCount"] = data.frames.size()
	result["fps"] = data.fps
	result["frameDuration"] = data.frames[0].duration
	result["tag"] = data.tags[0].name
	result["activeProjectUnchanged"] = global.get("current_project") == active_before
	result["exports"] = exports
	return result

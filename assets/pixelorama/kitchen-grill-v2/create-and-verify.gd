const W = 96
const H = 58
const LAYERS = ["01 - contact shadow", "02 - counter-height steel planes", "03 - low backsplash", "04 - bare flat cooking plate", "05 - grease channel", "06 - controls and cabinet details", "07 - hard reflections and rose accent"]

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
	var prototype = null
	for candidate in global.get("projects"):
		if candidate.name == "back-grill" and candidate.size == Vector2i(96,64) and candidate.layers.size() == 7 and candidate.palettes.size() > 0 and candidate.animation_tags.size() > 0:
			if JSON.parse_string(candidate.palettes.values()[0].serialize()).colors.size() == 14:
				prototype = candidate
				break
	if prototype == null:
		return {"error": "Approved seven-layer grill palette/tag prototype unavailable; no source created"}
	var target = load("res://src/Classes/Project.gd").new(Array([], TYPE_OBJECT, "RefCounted", load("res://src/Classes/Frame.gd")), "kitchen-grill-v2", Vector2i(W, H))
	if target.frames.size() != 0 or target.layers.size() != 0:
		return {"error": "Expected a private empty native project"}
	var frame = load("res://src/Classes/Frame.gd").new()
	var generator = GDScript.new()
	generator.source_code = "extends RefCounted\n" + FileAccess.get_file_as_string(source_dir.path_join("draw.gd"))
	if generator.reload() != OK:
		return {"error": "Drawing recipe failed compilation"}
	var drawer = generator.new()
	for role in range(7):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target, LAYERS[role])
		var pixels = drawer.call("run", null, null, target, {"role": role})
		if not pixels is Image or pixels.get_size() != Vector2i(W, H):
			return {"error": "Wrong native cel size"}
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pixels))
	target.frames.append(frame)
	target.current_frame = 0
	target.current_layer = 0
	target.fps = 1
	target.frames[0].duration = 1.0
	var palette_name = "Kitchen grill v2 - approved rose cream chrome"
	target.palettes.clear()
	target.palettes[palette_name] = prototype.palettes.values()[0].duplicate()
	target.animation_tags.append(prototype.animation_tags[0].get_script().new("kitchen-grill-v2-static", Color("#ee75a3"), 1, 1))
	var complete = blend_layers(target, [0, 1, 2, 3, 4, 5, 6])
	var body = blend_layers(target, [1, 2, 3, 4, 5, 6])
	var shadow = blend_layers(target, [0])
	var saved = root.get_node("OpenSave").call("save_pxo_file", source_dir.path_join("kitchen-grill.pxo"), false, target)
	if not saved:
		return {"error": "Native explicit-project save failed"}
	var codes = {}
	codes["native"] = complete.save_png(output_dir.path_join("kitchen-grill.png"))
	codes["body"] = body.save_png(output_dir.path_join("kitchen-grill-body.png"))
	codes["shadow"] = shadow.save_png(output_dir.path_join("kitchen-grill-shadow.png"))
	codes["atlas"] = complete.save_png(output_dir.path_join("kitchen-grill-atlas.png"))
	var preview = complete.duplicate()
	preview.resize(W * 6, H * 6, Image.INTERPOLATE_NEAREST)
	codes["preview"] = preview.save_png(source_dir.path_join("kitchen-grill-preview.png"))
	var atlas = {"frames": {"kitchen-grill_0": {"frame": {"x": 0, "y": 0, "w": W, "h": H}, "rotated": false, "trimmed": false, "spriteSourceSize": {"x": 0, "y": 0, "w": W, "h": H}, "sourceSize": {"w": W, "h": H}, "duration": 1000}}, "meta": {"app": "Pixelorama MCP native project export", "format": "RGBA8888", "image": "kitchen-grill-atlas.png", "scale": "1", "size": {"w": W, "h": H}, "frameTags": [{"name": "kitchen-grill-v2-static", "from": 0, "to": 0, "direction": "forward", "color": "ee75a3ff"}]}}
	var atlas_file = FileAccess.open(output_dir.path_join("kitchen-grill-atlas.json"), FileAccess.WRITE)
	atlas_file.store_string(JSON.stringify(atlas, "  ") + "\n")
	atlas_file.close()
	var zip = ZIPReader.new()
	if zip.open(source_dir.path_join("kitchen-grill.pxo")) != OK:
		return {"error": "Cannot reopen saved native ZIP"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened = Image.create(W, H, false, Image.FORMAT_RGBA8)
	reopened.fill(Color(0, 0, 0, 0))
	var cel_sizes = []
	for index in range(1, 8):
		var raw = zip.read_file("image_data/frames/1/layer_" + str(index))
		cel_sizes.append(raw.size())
		if raw.size() != W * H * 4:
			return {"error": "Wrong saved RGBA cel size"}
		reopened.blend_rect(Image.create_from_data(W, H, false, Image.FORMAT_RGBA8, raw), Rect2i(0, 0, W, H), Vector2i.ZERO)
	zip.close()
	var palette_data = JSON.parse_string(data.palettes[0].values()[0])
	var native = Image.load_from_file(output_dir.path_join("kitchen-grill.png"))
	var rebuilt = Image.load_from_file(output_dir.path_join("kitchen-grill-shadow.png"))
	rebuilt.blend_rect(Image.load_from_file(output_dir.path_join("kitchen-grill-body.png")), Rect2i(0, 0, W, H), Vector2i.ZERO)
	var top = Image.load_from_file(str(params.public_art_root).path_join("kitchen-counter-review/steel-counter-top.png"))
	var face = Image.load_from_file(str(params.public_art_root).path_join("kitchen-counter-review/steel-counter-front.png"))
	var profile_matches = true
	for y in range(24):
		if body.get_pixel(95, 16 + y) != top.get_pixel(0,y):
			profile_matches = false
	for y in range(16):
		if body.get_pixel(95, 40 + y) != face.get_pixel(0,y):
			profile_matches = false
	var result = sprite_qa(complete)
	result.merge({"saved": saved, "sourceSize": [data.size_x, data.size_y], "sourceLayers": data.layers.size(), "frames": data.frames.size(), "celByteSizes": cel_sizes, "paletteSwatches": palette_data.colors.size(), "tag": data.tags[0].name, "sourcePixelsMatchNativePng": reopened.get_data() == native.get_data(), "componentsReconstructExactly": rebuilt.get_data() == native.get_data(), "counterRightJoinAll40RowsMatch": profile_matches, "activeProjectUnchanged": global.get("current_project") == active_before, "exportCodes": codes})
	var report = FileAccess.open(output_dir.path_join("verification.json"), FileAccess.WRITE)
	report.store_string(JSON.stringify(result, "  ") + "\n")
	report.close()
	return result

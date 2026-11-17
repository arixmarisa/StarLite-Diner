const W = 32
const H = 40
const LAYERS = ["01 - contact shadow", "02 - chrome cabinet and base", "03 - cream header and rose trim", "04 - three taps and drip tray", "05 - highlights and reflections"]

func blend_layers(target, start, end):
	var output = Image.create(W, H, false, Image.FORMAT_RGBA8)
	output.fill(Color(0, 0, 0, 0))
	for index in range(start, end):
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
				var has_neighbor = false
				for dy in range(-1, 2):
					for dx in range(-1, 2):
						if dx == 0 and dy == 0:
							continue
						var xx = x + dx
						var yy = y + dy
						if xx >= 0 and yy >= 0 and xx < W and yy < H and picture.get_pixel(xx, yy).a > 0:
							has_neighbor = true
				if not has_neighbor:
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
			var touches_boundary = false
			var head = 0
			while head < queue.size():
				var point = queue[head]
				head += 1
				if point.x == 0 or point.y == 0 or point.x == W - 1 or point.y == H - 1:
					touches_boundary = true
				for offset in [Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP, Vector2i.DOWN]:
					var next = point + offset
					if next.x < 0 or next.y < 0 or next.x >= W or next.y >= H:
						continue
					var next_key = next.y * W + next.x
					if not visited.has(next_key) and picture.get_pixel(next.x, next.y).a == 0:
						visited[next_key] = true
						queue.append(next)
			if not touches_boundary:
				holes.append(queue.size())
	var bounds = picture.get_used_rect()
	return {"opaquePixels": opaque, "semitransparentPixels": semi, "visibleColors": histogram.size(), "orphans": orphans, "holes": holes, "bounds": {"x": bounds.position.x, "y": bounds.position.y, "width": bounds.size.x, "height": bounds.size.y}}

func run(api, image, project, params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	var target = load("res://src/Classes/Project.gd").new(Array([], TYPE_OBJECT, "RefCounted", load("res://src/Classes/Frame.gd")), "soda-unit", Vector2i(W, H))
	if target.frames.size() != 0 or target.layers.size() != 0:
		return {"error": "Expected a private empty native project"}
	var frame = load("res://src/Classes/Frame.gd").new()
	var generator = GDScript.new()
	generator.source_code = "extends RefCounted\n" + FileAccess.get_file_as_string(source_dir.path_join("draw.gd"))
	if generator.reload() != OK:
		return {"error": "Drawing recipe failed to compile"}
	var drawer = generator.new()
	for role in range(5):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target, LAYERS[role])
		var pixels = drawer.call("run", null, null, target, {"role": role})
		if not pixels is Image or pixels.get_size() != Vector2i(W, H):
			return {"error": "Drawing recipe returned incorrect cel dimensions"}
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pixels))
	target.frames.append(frame)
	target.current_frame = 0
	target.current_layer = 0
	target.fps = 1
	var swatches = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var palette_name = "Soda unit - approved rose cream chrome"
	var palette = load("res://src/Palette/Palette.gd").new(palette_name, 7, 2, "Original approved booth palette")
	palette.is_project_palette = true
	for swatch in swatches.colors:
		palette.add_color(Color(str(swatch.hex)))
	target.palettes[palette_name] = palette
	target.project_current_palette_name = palette_name
	target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new("soda-unit-static", Color("#ee75a3"), 1, 1))
	var complete = blend_layers(target, 0, 5)
	var shadow = blend_layers(target, 0, 1)
	var body = blend_layers(target, 1, 5)
	var saved = root.get_node("OpenSave").call("save_pxo_file", source_dir.path_join("soda-unit.pxo"), false, target)
	if not saved:
		return {"error": "Native targeted source save failed"}
	var codes = {}
	codes["native"] = complete.save_png(output_dir.path_join("soda-unit.png"))
	codes["shadow"] = shadow.save_png(output_dir.path_join("soda-unit-shadow.png"))
	codes["body"] = body.save_png(output_dir.path_join("soda-unit-body.png"))
	var preview = complete.duplicate()
	preview.resize(W * 6, H * 6, Image.INTERPOLATE_NEAREST)
	codes["preview"] = preview.save_png(source_dir.path_join("soda-unit-preview.png"))
	var zip = ZIPReader.new()
	if zip.open(source_dir.path_join("soda-unit.pxo")) != OK:
		return {"error": "Cannot reopen saved native source ZIP"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened = Image.create(W, H, false, Image.FORMAT_RGBA8)
	reopened.fill(Color(0, 0, 0, 0))
	var cel_sizes = []
	for index in range(1, 6):
		var raw = zip.read_file("image_data/frames/1/layer_" + str(index))
		cel_sizes.append(raw.size())
		if raw.size() != W * H * 4:
			return {"error": "Saved cel has incorrect RGBA byte length"}
		reopened.blend_rect(Image.create_from_data(W, H, false, Image.FORMAT_RGBA8, raw), Rect2i(0, 0, W, H), Vector2i.ZERO)
	zip.close()
	var palette_data = JSON.parse_string(data.palettes[0].values()[0])
	var native = Image.load_from_file(output_dir.path_join("soda-unit.png"))
	var reconstructed = Image.load_from_file(output_dir.path_join("soda-unit-shadow.png"))
	reconstructed.blend_rect(Image.load_from_file(output_dir.path_join("soda-unit-body.png")), Rect2i(0, 0, W, H), Vector2i.ZERO)
	var result = sprite_qa(complete)
	result.merge({"saved": saved, "sourceSize": [data.size_x, data.size_y], "sourceLayers": data.layers.size(), "frames": data.frames.size(), "celByteSizes": cel_sizes, "paletteSwatches": palette_data.colors.size(), "tag": data.tags[0].name, "sourcePixelsMatchNativePng": reopened.get_data() == native.get_data(), "componentsReconstructExactly": reconstructed.get_data() == native.get_data(), "activeProjectUnchanged": global.get("current_project") == active_before, "exportCodes": codes})
	return result

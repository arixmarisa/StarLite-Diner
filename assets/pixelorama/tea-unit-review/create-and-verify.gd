func blend_layers(target, start, end):
	var output = Image.create(24, 32, false, Image.FORMAT_RGBA8)
	output.fill(Color(0, 0, 0, 0))
	for index in range(start, end):
		output.blend_rect(target.frames[0].cels[index].get_image(), Rect2i(0, 0, 24, 32), Vector2i.ZERO)
	return output

func run(api, image, project, params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var spec = JSON.parse_string(FileAccess.get_file_as_string(str(params.source_dir).path_join("geometry.json")))
	var target = load("res://src/Classes/Project.gd").new(Array([], TYPE_OBJECT, "RefCounted", load("res://src/Classes/Frame.gd")), "tea-unit", Vector2i(24, 32))
	if target.frames.size() != 0 or target.layers.size() != 0:
		return {"error": "Expected private empty project"}
	var frame = load("res://src/Classes/Frame.gd").new()
	var generator = GDScript.new()
	generator.source_code = "extends RefCounted\n" + FileAccess.get_file_as_string(str(params.source_dir).path_join("draw.gd"))
	if generator.reload() != OK:
		return {"error": "Drawing recipe does not compile"}
	var drawer = generator.new()
	for role in range(5):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target, str(spec.layers[role]))
		var pixels = drawer.call("run", null, null, target, {"spec": spec, "role": role})
		if not pixels is Image or pixels.get_size() != Vector2i(24, 32):
			return {"error": "Wrong cel image"}
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pixels))
	target.frames.append(frame)
	target.current_frame = 0
	target.current_layer = 0
	target.fps = 1
	var palette_name = "Tea unit - approved rose cream chrome"
	var palette = load("res://src/Palette/Palette.gd").new(palette_name, 7, 2, "Original approved booth palette")
	palette.is_project_palette = true
	for color in spec.palette:
		palette.add_color(Color(str(color)))
	target.palettes[palette_name] = palette
	target.project_current_palette_name = palette_name
	var tag = load("res://src/Classes/AnimationTag.gd").new("tea-unit-static", Color("#ee75a3"), 1, 1)
	target.animation_tags.append(tag)
	var complete = blend_layers(target, 0, 5)
	var saved = root.get_node("OpenSave").call("save_pxo_file", str(params.source_dir).path_join("tea-unit.pxo"), false, target)
	if not saved:
		return {"error": "Native project save failed"}
	var output_dir = str(params.output_dir)
	var codes = {}
	codes["native"] = complete.save_png(output_dir.path_join("tea-unit.png"))
	codes["body"] = blend_layers(target, 1, 5).save_png(output_dir.path_join("tea-unit-body.png"))
	codes["shadow"] = blend_layers(target, 0, 1).save_png(output_dir.path_join("tea-unit-shadow.png"))
	var preview = complete.duplicate()
	preview.resize(144, 192, Image.INTERPOLATE_NEAREST)
	codes["preview"] = preview.save_png(str(params.source_dir).path_join("tea-unit-preview.png"))
	var zip = ZIPReader.new()
	if zip.open(str(params.source_dir).path_join("tea-unit.pxo")) != OK:
		return {"error": "Cannot reopen native project"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var rebuilt = Image.create(24, 32, false, Image.FORMAT_RGBA8)
	rebuilt.fill(Color(0, 0, 0, 0))
	var sizes = []
	for i in range(1, 6):
		var raw = zip.read_file("image_data/frames/1/layer_" + str(i))
		sizes.append(raw.size())
		rebuilt.blend_rect(Image.create_from_data(24, 32, false, Image.FORMAT_RGBA8, raw), Rect2i(0, 0, 24, 32), Vector2i.ZERO)
	zip.close()
	var histogram = {}
	var opaque = 0
	var semi = 0
	for y in range(32):
		for x in range(24):
			var color = complete.get_pixel(x, y)
			if color.a == 1:
				opaque += 1
				histogram[color.to_html()] = true
			elif color.a != 0:
				semi += 1
	var palette_data = JSON.parse_string(data.palettes[0].values()[0])
	return {"saved": saved, "size": [data.size_x, data.size_y], "layers": data.layers.size(), "celByteSizes": sizes, "paletteSwatches": palette_data.colors.size(), "tag": data.tags[0].name, "sourcePixelsMatchNative": rebuilt.get_data() == complete.get_data(), "activeProjectUnchanged": global.get("current_project") == active_before, "opaquePixels": opaque, "visibleColors": histogram.size(), "semitransparentPixels": semi, "bounds": str(complete.get_used_rect()), "exportCodes": codes}

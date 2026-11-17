func run(api, image, project, params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var repo = str(params.repo_dir)
	var source_dir = repo.path_join("assets/pixelorama/front-of-house-layout-v2")
	var output_dir = repo.path_join("apps/web/public/art/front-of-house-layout-v2")
	var map = JSON.parse_string(FileAccess.get_file_as_string(output_dir.path_join("layout.json")))
	var size = Vector2i(int(map.size.width), int(map.size.height))
	var cache = {}
	for asset in map.assets:
		var pixels = Image.load_from_file(repo.path_join(str(asset.repositoryImage)))
		if pixels == null or pixels.get_size() != Vector2i(int(asset.size[0]), int(asset.size[1])):
			return {"error": "Missing or incorrectly sized source", "asset": asset.id}
		pixels.convert(Image.FORMAT_RGBA8)
		cache[asset.id] = pixels
	var images = []
	for name in map.layers:
		images.append(Image.create(size.x, size.y, false, Image.FORMAT_RGBA8))
	var floor = map.floor
	if floor.visible:
		for y in range(int(floor.y), int(floor.y + floor.height), 16):
			for x in range(int(floor.x), int(floor.x + floor.width), 16):
				images[0].blend_rect(cache[floor.asset], Rect2i(0, 0, mini(16, int(floor.x + floor.width) - x), mini(16, int(floor.y + floor.height) - y)), Vector2i(x, y))
	for item in map.instances:
		var pixels = cache[item.asset]
		var area = Rect2i(Vector2i.ZERO, pixels.get_size())
		if item.clip != null:
			area = Rect2i(int(item.clip.x), int(item.clip.y), int(item.clip.width), int(item.clip.height))
		images[int(item.layer)].blend_rect(pixels, area, Vector2i(int(item.x), int(item.y)) + area.position)
	var target = load("res://src/Classes/Project.gd").new(Array([], TYPE_OBJECT, "RefCounted", load("res://src/Classes/Frame.gd")), "front-of-house-layout-v2", size)
	var frame = load("res://src/Classes/Frame.gd").new()
	var complete = Image.create(size.x, size.y, false, Image.FORMAT_RGBA8)
	for index in range(map.layers.size()):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target, str(map.layers[index]))
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(images[index]))
		complete.blend_rect(images[index], Rect2i(Vector2i.ZERO, size), Vector2i.ZERO)
	target.frames.append(frame)
	target.fps = 1
	var palette_data = JSON.parse_string(FileAccess.get_file_as_string(repo.path_join(str(map.paletteSource))))
	var palette = load("res://src/Palette/Palette.gd").new("Diner layout - shared v1 palette", 7, 3, "Original native furniture palette")
	palette.is_project_palette = true
	for color in palette_data.colors:
		palette.add_color(Color(str(color.hex)))
	target.palettes[palette.name] = palette
	target.project_current_palette_name = palette.name
	target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new("reviewed-layout-static", Color("#ee75a3"), 1, 1))
	if not root.get_node("OpenSave").call("save_pxo_file", source_dir.path_join("front-of-house-layout-v2.pxo"), false, target):
		return {"error": "Cannot save explicit project"}
	complete.save_png(output_dir.path_join("layout.png"))
	var preview = complete.duplicate()
	preview.resize(size.x * 2, size.y * 2, Image.INTERPOLATE_NEAREST)
	preview.save_png(source_dir.path_join("layout-preview-2x.png"))
	var zip = ZIPReader.new()
	if zip.open(source_dir.path_join("front-of-house-layout-v2.pxo")) != OK:
		return {"error": "Cannot reopen saved project"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	for index in range(images.size()):
		if zip.read_file("image_data/frames/1/layer_" + str(index + 1)) != images[index].get_data():
			return {"error": "Saved source cel mismatch", "layer": index}
	zip.close()
	var result = {"size": [data.size_x, data.size_y], "layers": data.layers.size(), "frames": data.frames.size(), "fps": data.fps, "tag": data.tags[0].name, "paletteSwatches": palette_data.colors.size(), "savedCelsMatch": true, "activeProjectUnchanged": global.get("current_project") == active_before, "instances": map.instances.size()}
	var report = FileAccess.open(source_dir.path_join("pixel-verification.json"), FileAccess.WRITE)
	report.store_string(JSON.stringify(result, "  ") + "\n")
	return result

func blank(width, height):
	var result = Image.create(width, height, false, Image.FORMAT_RGBA8)
	result.fill(Color(0, 0, 0, 0))
	return result

func composite(images, width, height):
	var result = blank(width, height)
	for pixels in images:
		result.blend_rect(pixels, Rect2i(0, 0, width, height), Vector2i.ZERO)
	return result

func source_layers(path):
	var zip = ZIPReader.new()
	if zip.open(path) != OK:
		return []
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	if int(data.size_x) != 80 or int(data.size_y) != 104 or data.layers.size() != 8:
		zip.close()
		return []
	var result = []
	for index in range(1, 9):
		var bytes = zip.read_file("image_data/frames/1/layer_" + str(index))
		if bytes.size() != 80 * 104 * 4:
			zip.close()
			return []
		result.append(Image.create_from_data(80, 104, false, Image.FORMAT_RGBA8, bytes))
	zip.close()
	return result

func run(api, image, project, params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var repo = str(params.repo_dir)
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	var map = JSON.parse_string(FileAccess.get_file_as_string(output_dir.path_join("layout.json")))
	var width = int(map.size.width)
	var height = int(map.size.height)
	var existing = source_layers(repo.path_join("assets/pixelorama/booth-orientations-review/booth-above-below.pxo"))
	if existing.size() != 8:
		return {"error": "Expected unchanged eight-layer80x104 booth source"}
	var leg_area = Rect2i(21, 55, 38, 29)
	var legs = blank(80, 104)
	legs.blit_rect(existing[1], leg_area, leg_area.position)
	var bench_metal = existing[1].duplicate()
	bench_metal.fill_rect(leg_area, Color(0, 0, 0, 0))
	var booth_base = composite([existing[0], bench_metal, existing[2], existing[3], existing[5]], 80, 104)
	var booth_table = composite([legs, existing[4]], 80, 104)
	var booth_front = existing[6].duplicate()
	for y in range(104):
		for x in range(80):
			var detail = existing[7].get_pixel(x, y)
			if detail.a > 0:
				if booth_front.get_pixel(x, y).a > 0:
					booth_front.set_pixel(x, y, detail)
				else:
					booth_base.set_pixel(x, y, detail)
	var source_booth = composite(existing, 80, 104)
	var rebuilt_booth = composite([booth_base, booth_table, booth_front], 80, 104)
	if source_booth.get_data() != rebuilt_booth.get_data():
		return {"error": "Derived booth components changed source pixels"}
	var cache = {"booth-ns-base": booth_base, "booth-ns-table": booth_table, "booth-ns-foreground": booth_front}
	for entry in [["base", booth_base], ["table", booth_table], ["foreground", booth_front]]:
		if entry[1].save_png(output_dir.path_join("booth-above-below-" + entry[0] + ".png")) != OK:
			return {"error": "Cannot export unchanged booth component"}
	for item in map.assets:
		var path = repo.path_join(str(item.repositoryImage))
		if not cache.has(item.id):
			var picture = Image.load_from_file(path)
			if picture == null or picture.is_empty():
				return {"error": "Missing modular asset", "path": path}
			picture.convert(Image.FORMAT_RGBA8)
			cache[item.id] = picture
		var actual = cache[item.id].get_size()
		if actual != Vector2i(int(item.size[0]), int(item.size[1])):
			return {"error": "Asset dimension mismatch", "asset": item.id, "size": str(actual)}
		var used = cache[item.id].get_used_rect()
		item["occupiedBounds"] = {"x": used.position.x, "y": used.position.y, "width": used.size.x, "height": used.size.y}
	var images = []
	for name in map.layers:
		images.append(blank(width, height))
	var floor = map.floor
	var tile = cache[floor.asset]
	for y in range(int(floor.y), int(floor.y + floor.height), int(floor.tileSize)):
		for x in range(int(floor.x), int(floor.x + floor.width), int(floor.tileSize)):
			var area = Rect2i(0, 0, mini(16, int(floor.x + floor.width) - x), mini(16, int(floor.y + floor.height) - y))
			images[0].blend_rect(tile, area, Vector2i(x, y))
	for item in map.instances:
		if int(item.scale) != 1 or int(item.rotation) != 0:
			return {"error": "Only native integer placements are allowed", "id": item.id}
		var picture = cache[item.asset]
		var area = Rect2i(Vector2i.ZERO, picture.get_size())
		if item.has("clip"):
			area = Rect2i(int(item.clip.x), int(item.clip.y), int(item.clip.width), int(item.clip.height))
		if not Rect2i(Vector2i.ZERO, picture.get_size()).encloses(area):
			return {"error": "Invalid native clip", "id": item.id}
		images[int(item.layer)].blend_rect(picture, area, Vector2i(int(item.x), int(item.y)))
	var target = load("res://src/Classes/Project.gd").new(Array([], TYPE_OBJECT, "RefCounted", load("res://src/Classes/Frame.gd")), "front-of-house-layout", Vector2i(width, height))
	var frame = load("res://src/Classes/Frame.gd").new()
	for index in range(map.layers.size()):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target, str(map.layers[index]))
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(images[index]))
	target.frames.append(frame)
	target.current_frame = 0
	target.current_layer = 0
	target.fps = 1
	var palette_data = JSON.parse_string(FileAccess.get_file_as_string(repo.path_join(str(map.paletteSource))))
	var palette = load("res://src/Palette/Palette.gd").new("Diner layout - shared v1 palette", 7, 3, "Unchanged native asset palette")
	palette.is_project_palette = true
	for color in palette_data.colors:
		palette.add_color(Color(str(color.hex)))
	target.palettes[palette.name] = palette
	target.project_current_palette_name = palette.name
	target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new("layout-static", Color("#ee75a3"), 1, 1))
	var complete = composite(images, width, height)
	var saved = root.get_node("OpenSave").call("save_pxo_file", source_dir.path_join("front-of-house-layout.pxo"), false, target)
	if not saved:
		return {"error": "Cannot save explicit layout project"}
	var native_code = complete.save_png(output_dir.path_join("layout.png"))
	var preview = complete.duplicate()
	preview.resize(width * 2, height * 2, Image.INTERPOLATE_NEAREST)
	var preview_code = preview.save_png(source_dir.path_join("layout-preview-2x.png"))
	var zip = ZIPReader.new()
	if zip.open(source_dir.path_join("front-of-house-layout.pxo")) != OK:
		return {"error": "Cannot reopen saved layout source"}
	var saved_data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened = blank(width, height)
	for index in range(1, images.size() + 1):
		var raw = zip.read_file("image_data/frames/1/layer_" + str(index))
		if raw.size() != width * height * 4:
			zip.close()
			return {"error": "Wrong saved cel dimensions"}
		reopened.blend_rect(Image.create_from_data(width, height, false, Image.FORMAT_RGBA8, raw), Rect2i(0, 0, width, height), Vector2i.ZERO)
	zip.close()
	var saved_palette = JSON.parse_string(saved_data.palettes[0].values()[0])
	var result = {"saved": saved, "size": [saved_data.size_x, saved_data.size_y], "layers": saved_data.layers.size(), "paletteSwatches": saved_palette.colors.size(), "tag": saved_data.tags[0].name, "instances": map.instances.size(), "assetReferences": map.assets.size(), "derivedBoothComponentsExact": source_booth.get_data() == rebuilt_booth.get_data(), "savedSourceMatchesPng": reopened.get_data() == complete.get_data(), "activeProjectUnchanged": global.get("current_project") == active_before, "nativeExportCode": native_code, "previewExportCode": preview_code}
	map["pixelVerification"] = result
	var json_file = FileAccess.open(output_dir.path_join("layout.json"), FileAccess.WRITE)
	json_file.store_string(JSON.stringify(map, "  ") + "\n")
	json_file.close()
	var report = FileAccess.open(source_dir.path_join("pixel-verification.json"), FileAccess.WRITE)
	report.store_string(JSON.stringify(result, "  ") + "\n")
	report.close()
	return result

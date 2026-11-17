func blend_project(target, indices):
	var output = Image.create(64, 72, false, Image.FORMAT_RGBA8)
	output.fill(Color(0, 0, 0, 0))
	for index in indices:
		output.blend_rect(target.frames[0].cels[index].get_image(), Rect2i(0, 0, 64, 72), Vector2i.ZERO)
	return output

func run(api, image, project, params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var expected = ["01 - lower chrome and facade contours", "02 - curved rose fascia", "03 - cream laminate top", "04 - chrome outer rim and foreground lip"]
	var matches = []
	for candidate in global.get("projects"):
		if candidate.name != "curved-counter" or candidate.size != Vector2i(64, 72) or candidate.layers.size() != 4:
			continue
		var names_match = true
		for i in range(4):
			if candidate.layers[i].name != expected[i]:
				names_match = false
		if names_match:
			matches.append(candidate)
	if matches.size() != 1:
		return {"error": "Expected one unambiguous64x72 four-layer curved-counter project", "matches": matches.size()}
	var target = matches[0]
	var active_before = global.get("current_project")
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	if bool(params.get("rebuild_roles", false)):
		var generator = GDScript.new()
		generator.source_code = "extends RefCounted\n" + FileAccess.get_file_as_string(source_dir.path_join("draw.gd"))
		if generator.reload() != OK:
			return {"error": "Drawing recipe failed compilation"}
		var instance = generator.new()
		for role in [2, 3]:
			var drawn = instance.call("run", null, null, target, {"role": role, "reference_dir": params.reference_dir})
			if not drawn is Image or drawn.get_size() != Vector2i(64, 72):
				return {"error": "Drawing recipe returned wrong image"}
			var cel = target.frames[0].cels[role]
			cel.get_image().copy_from(drawn)
			var texture = cel.get("image_texture")
			if texture != null and texture.has_method("update"):
				texture.call("update", cel.get_image())
	var composite = blend_project(target, [0, 1, 2, 3])
	var area = Rect2i(8, 8, 40, 56)
	var piece = composite.get_region(area)
	var previous = Image.load_from_file(output_dir.path_join("curved-counter.png"))
	if piece.get_data() != previous.get_data():
		return {"error": "Target differs visually or in alpha from reviewed native PNG; no save"}
	var saved = root.get_node("OpenSave").call("save_pxo_file", source_dir.path_join("curved-counter.pxo"), false, target)
	if not saved:
		return {"error": "Native targeted source save failed"}
	var base = blend_project(target, [0, 1, 2]).get_region(area)
	var foreground = blend_project(target, [3]).get_region(area)
	var rebuilt = base.duplicate()
	rebuilt.blend_rect(foreground, Rect2i(0, 0, 40, 56), Vector2i.ZERO)
	var export_codes = [base.save_png(output_dir.path_join("curved-counter-base.png")), foreground.save_png(output_dir.path_join("curved-counter-foreground.png")), composite.save_png(output_dir.path_join("curved-counter-atlas.png"))]
	var zip = ZIPReader.new()
	if zip.open(source_dir.path_join("curved-counter.pxo")) != OK:
		return {"error": "Cannot reopen saved source ZIP"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened = Image.create(64, 72, false, Image.FORMAT_RGBA8)
	reopened.fill(Color(0, 0, 0, 0))
	for i in range(1, 5):
		var raw = zip.read_file("image_data/frames/1/layer_" + str(i))
		var layer = Image.create_from_data(64, 72, false, Image.FORMAT_RGBA8, raw)
		reopened.blend_rect(layer, Rect2i(0, 0, 64, 72), Vector2i.ZERO)
	zip.close()
	var palette_data = JSON.parse_string(data.palettes[0].values()[0])
	var native_top = Image.load_from_file(str(params.reference_dir).path_join("counter-top.png"))
	var native_front = Image.load_from_file(str(params.reference_dir).path_join("counter-front.png"))
	var native_vertical = Image.load_from_file(str(params.reference_dir).path_join("counter-vertical.png"))
	var west_matches = true
	for row in range(40):
		var expected_pixel = native_top.get_pixel(0, row) if row < 24 else native_front.get_pixel(0, row - 24)
		if piece.get_pixel(0, 16 + row) != expected_pixel:
			west_matches = false
	var north_matches = true
	for column in range(24):
		if piece.get_pixel(16 + column, 0) != native_vertical.get_pixel(column, 0):
			north_matches = false
	return {"savedTargetedNativeSource": saved, "activeProjectUnchanged": global.get("current_project") == active_before, "sourceSize": [data.size_x, data.size_y], "sourceLayers": data.layers.size(), "paletteSwatches": palette_data.colors.size(), "tag": data.tags[0].name, "reopenedSavedSourcePixelsMatchPng": reopened.get_region(area).get_data() == previous.get_data(), "componentsReconstructByteForByte": rebuilt.get_data() == previous.get_data(), "west40RowEndpointMatches": west_matches, "north24PixelEndpointMatches": north_matches, "atlasSize": [composite.get_width(), composite.get_height()], "exportCodes": export_codes}

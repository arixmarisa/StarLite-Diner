func blank():
	var result = Image.create(24, 48, false, Image.FORMAT_RGBA8)
	result.fill(Color.TRANSPARENT)
	return result

func run(api, image, project, params):
	var source = api.get_composite_image()
	if source.get_size() != Vector2i(24, 48):
		return {"error": "Open the24x48 counter-side source before exporting"}
	var output_dir = str(params.output_dir)
	var reference_dir = str(params.reference_dir)
	DirAccess.make_dir_recursive_absolute(output_dir)
	var top = source.get_region(Rect2i(0, 0, 24, 16))
	var lip = source.get_region(Rect2i(20, 0, 4, 16))
	var fascia = source.get_region(Rect2i(0, 32, 24, 16))
	var base = blank()
	base.blit_rect(source, Rect2i(0, 0, 20, 32), Vector2i.ZERO)
	var foreground = blank()
	foreground.blit_rect(source, Rect2i(20, 0, 4, 32), Vector2i(20, 0))
	foreground.blit_rect(source, Rect2i(0, 32, 24, 16), Vector2i(0, 32))
	var rebuilt = base.duplicate()
	rebuilt.blend_rect(foreground, Rect2i(0, 0, 24, 48), Vector2i.ZERO)
	var codes = {}
	for item in [["counter-vertical-top.png", top], ["counter-side-lip.png", lip], ["counter-side-fascia.png", fascia], ["counter-side-base.png", base], ["counter-side-foreground.png", foreground]]:
		codes[item[0]] = item[1].save_png(output_dir.path_join(item[0]))
	var original_top = Image.load_from_file(reference_dir.path_join("counter-vertical.png"))
	var original_front = Image.load_from_file(reference_dir.path_join("counter-front.png"))
	var original_lip = original_top.get_region(Rect2i(20, 0, 4, 16))
	var fascia_profile = true
	for y in range(16):
		for x in range(24):
			var sx = 0 if x == 0 else (15 if x == 23 else 8)
			if fascia.get_pixel(x, y) != original_front.get_pixel(sx, y):
				fascia_profile = false
	var exported = Image.load_from_file(output_dir.path_join("counter-side.png"))
	var layer_data = []
	for layer in project.layers:
		var img = api.get_layer_image(layer.name)
		layer_data.append({"name":layer.name, "size":str(img.get_size()), "bounds":str(img.get_used_rect())})
	return {
		"source_matches_native_export": source.get_data() == exported.get_data(),
		"base_foreground_reconstruct_exactly": source.get_data() == rebuilt.get_data(),
		"top_tile_matches_original": top.get_data() == original_top.get_data(),
		"second_top_tile_matches_original": source.get_region(Rect2i(0,16,24,16)).get_data() == original_top.get_data(),
		"vertical_lip_matches_original_crop": lip.get_data() == original_lip.get_data(),
		"near_fascia_profile_matches_original_rows": fascia_profile,
		"tile_top_and_bottom_rows_identical": top.get_region(Rect2i(0,0,24,1)).get_data() == top.get_region(Rect2i(0,15,24,1)).get_data(),
		"output_codes":codes, "layers":layer_data
	}

func run(api, image, project, params):
	var output_dir = str(params.output_dir)
	var reference_dir = str(params.reference_dir)
	var composite = api.get_composite_image()
	if project.size != Vector2i(64, 72):
		return {"error": "Open64x72 curved-counter source first"}
	var area = Rect2i(8, 8, 40, 56)
	var piece = composite.get_region(area)
	var base = Image.create(64, 72, false, Image.FORMAT_RGBA8)
	base.fill(Color(0, 0, 0, 0))
	for name in ["01 - lower chrome and facade contours", "02 - curved rose fascia", "03 - cream laminate top"]:
		base.blend_rect(api.get_layer_image(name), Rect2i(0, 0, 64, 72), Vector2i.ZERO)
	var trim = api.get_layer_image("04 - chrome outer rim and foreground lip").duplicate()
	for y in range(72):
		for x in range(64):
			if trim.get_pixel(x, y).a == 0.0:
				trim.set_pixel(x, y, Color(0, 0, 0, 0))
	var rebuilt = base.duplicate()
	rebuilt.blend_rect(trim, Rect2i(0, 0, 64, 72), Vector2i.ZERO)
	var result_codes = {}
	result_codes["curved-counter.png"] = piece.save_png(output_dir.path_join("curved-counter.png"))
	result_codes["curved-counter-base.png"] = base.get_region(area).save_png(output_dir.path_join("curved-counter-base.png"))
	result_codes["curved-counter-foreground.png"] = trim.get_region(area).save_png(output_dir.path_join("curved-counter-foreground.png"))
	var native_top = Image.load_from_file(reference_dir.path_join("counter-top.png"))
	var native_front = Image.load_from_file(reference_dir.path_join("counter-front.png"))
	var native_vertical = Image.load_from_file(reference_dir.path_join("counter-vertical.png"))
	var west_matches = true
	for row in range(40):
		var expected = native_top.get_pixel(0, row) if row < 24 else native_front.get_pixel(0, row - 24)
		if piece.get_pixel(0, 16 + row) != expected:
			west_matches = false
	var north_matches = true
	for column in range(24):
		if piece.get_pixel(16 + column, 0) != native_vertical.get_pixel(column, 0):
			north_matches = false
	var png = Image.load_from_file(output_dir.path_join("curved-counter.png"))
	return {"west40RowEndpointMatchesV1":west_matches, "north24PixelEndpointMatchesV1":north_matches, "componentReconstructionMatches":rebuilt.get_data() == composite.get_data(), "nativePngMatchesSource":png.get_data() == piece.get_data(), "exportCodes":result_codes}

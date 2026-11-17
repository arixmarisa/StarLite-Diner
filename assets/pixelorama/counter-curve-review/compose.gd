func run(api, image, project, params):
	var output = Image.create(104, 112, false, Image.FORMAT_RGBA8)
	output.fill(Color.TRANSPARENT)
	var reference_dir = str(params.reference_dir)
	if int(params.role) == 0:
		var top = Image.load_from_file(reference_dir.path_join("counter-top.png"))
		var front = Image.load_from_file(reference_dir.path_join("counter-front.png"))
		var vertical = Image.load_from_file(reference_dir.path_join("counter-vertical.png"))
		for x in [16, 32]:
			output.blit_rect(top, Rect2i(0, 0, 16, 24), Vector2i(x, 56))
			output.blit_rect(front, Rect2i(0, 0, 16, 16), Vector2i(x, 80))
		for y in [8, 24]:
			output.blit_rect(vertical, Rect2i(0, 0, 24, 16), Vector2i(64, y))
	else:
		var curve = Image.load_from_file(str(params.curve_png))
		output.blit_rect(curve, Rect2i(0, 0, 40, 56), Vector2i(48, 40))
	return output

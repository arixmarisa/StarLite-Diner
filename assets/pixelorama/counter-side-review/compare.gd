func run(api, image, project, params):
	var output = Image.create(96, 64, false, Image.FORMAT_RGBA8)
	output.fill(Color.TRANSPARENT)
	if int(params.role) == 0:
		var top = Image.load_from_file(str(params.reference_dir).path_join("counter-top.png"))
		var front = Image.load_from_file(str(params.reference_dir).path_join("counter-front.png"))
		for i in range(2):
			output.blit_rect(top, Rect2i(0, 0, 16, 24), Vector2i(8 + i * 16, 12))
			output.blit_rect(front, Rect2i(0, 0, 16, 16), Vector2i(8 + i * 16, 36))
	else:
		var side = Image.load_from_file(str(params.output_dir).path_join("counter-side.png"))
		output.blit_rect(side, Rect2i(0, 0, 24, 48), Vector2i(64, 8))
	return output

func run(api, image, project, params):
	var output = Image.create(176, 112, false, Image.FORMAT_RGBA8)
	output.fill(Color.TRANSPARENT)
	var source = Image.load_from_file(str(params.source))
	output.blit_rect(source, Rect2i(Vector2i.ZERO, source.get_size()), Vector2i(int(params.x), int(params.y)))
	return output

func composite_layers(api, names):
	var output = Image.create(128, 112, false, Image.FORMAT_RGBA8)
	output.fill(Color(0, 0, 0, 0))
	for name in names:
		var layer = api.get_layer_image(name)
		output.blend_rect(layer, Rect2i(0, 0, 128, 112), Vector2i.ZERO)
	return output

func run(api, image, project, params):
	var output_dir = str(params.output_dir)
	var source = api.get_composite_image()
	var png = Image.load_from_file(output_dir.path_join("circle-booth.png"))
	var base = composite_layers(api, ["01 - contact shadow", "02 - chrome curved plinth", "03 - rear curved backrest", "04 - curved seat cushions"])
	var table = composite_layers(api, ["05 - table pedestal and feet", "06 - round cream laminate table"])
	var front = api.get_layer_image("07 - foreground curved backrest").duplicate()
	var details = api.get_layer_image("08 - piping seams and highlights")
	for y in range(112):
		for x in range(128):
			var detail = details.get_pixel(x, y)
			if detail.a > 0.0:
				if front.get_pixel(x, y).a > 0.0:
					front.set_pixel(x, y, detail)
				else:
					base.set_pixel(x, y, detail)
	var outputs = {}
	for entry in [["circle-booth-base.png", base], ["round-table.png", table], ["circle-booth-foreground.png", front]]:
		outputs[entry[0]] = entry[1].save_png(output_dir.path_join(entry[0]))
	var rebuilt = base.duplicate()
	rebuilt.blend_rect(table, Rect2i(0, 0, 128, 112), Vector2i.ZERO)
	rebuilt.blend_rect(front, Rect2i(0, 0, 128, 112), Vector2i.ZERO)
	var hidden_foot_pixels = 0
	var pedestal = api.get_layer_image("05 - table pedestal and feet")
	var foot_hidden = true
	for y in range(77, 85):
		for x in range(53, 75):
			if pedestal.get_pixel(x, y).a > 0.0:
				hidden_foot_pixels += 1
				if front.get_pixel(x, y).a != 1.0:
					foot_hidden = false
	var layer_sizes = []
	for layer in project.layers:
		var picture = api.get_layer_image(layer.name)
		layer_sizes.append({"name":layer.name, "size":str(picture.get_size()), "bounds":str(picture.get_used_rect())})
	return {"native_png_matches_reopened_source":source.get_data() == png.get_data(), "components_reconstruct_exactly":source.get_data() == rebuilt.get_data(), "pedestal_lower_end_hidden":foot_hidden, "hidden_lower_pedestal_pixels":hidden_foot_pixels, "output_codes":outputs, "layers":layer_sizes}

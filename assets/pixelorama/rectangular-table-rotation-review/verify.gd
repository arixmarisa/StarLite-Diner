func run(api, image, project, params):
	var native = api.get_composite_image()
	var exported = Image.load_from_file(str(params.output_dir).path_join("table-horizontal.png"))
	var material = api.get_layer_image("04 - cream laminate and rim")
	var source = Image.load_from_file(str(params.original))
	var source_colors = []
	var new_colors = []
	for y in range(source.get_height()):
		for x in range(source.get_width()):
			var color = source.get_pixel(x, y)
			if color.a > 0.0 and not source_colors.has(color.to_html()):
				source_colors.append(color.to_html())
	for y in range(48):
		for x in range(48):
			var color = native.get_pixel(x, y)
			if color.a > 0.0 and not new_colors.has(color.to_html()):
				new_colors.append(color.to_html())
	var shared_colors = true
	for color in new_colors:
		if not source_colors.has(color):
			shared_colors = false
	var cream_bounds = Rect2i(48, 48, 0, 0)
	var cream_points = []
	for y in range(48):
		for x in range(48):
			if material.get_pixel(x, y) == Color("#f1e5d1"):
				cream_points.append(Vector2i(x, y))
	var min_point = Vector2i(48, 48)
	var max_point = Vector2i(-1, -1)
	for point in cream_points:
		min_point.x = mini(min_point.x, point.x)
		min_point.y = mini(min_point.y, point.y)
		max_point.x = maxi(max_point.x, point.x)
		max_point.y = maxi(max_point.y, point.y)
	var layer_data = []
	for layer in project.layers:
		var picture = api.get_layer_image(layer.name)
		layer_data.append({"name":layer.name,"size":str(picture.get_size()),"bounds":str(picture.get_used_rect())})
	return {"source_matches_native_png":native.get_data()==exported.get_data(),"material_rim_bounds":str(material.get_used_rect()),"cream_bounds":str(Rect2i(min_point,max_point-min_point+Vector2i.ONE)),"same_visible_palette":shared_colors and new_colors.size()==source_colors.size(),"visible_color_count":new_colors.size(),"upright_pedestal_and_foot_bounds":str(api.get_layer_image("02 - upright chrome pedestal and foot").get_used_rect()),"layers":layer_data}

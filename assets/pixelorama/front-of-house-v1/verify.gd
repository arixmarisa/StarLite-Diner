func run(api, image, project, params):
	var root = str(params.output_dir)
	var atlas = Image.load_from_file(root.path_join("atlas.png"))
	if atlas == null or atlas.is_empty():
		return {"error": "Missing atlas"}
	atlas.convert(Image.FORMAT_RGBA8)
	var composite = api.get_composite_image()
	composite.convert(Image.FORMAT_RGBA8)
	var errors = []
	if project.size != Vector2i(512,512) or composite.get_size() != atlas.get_size():
		errors.append("Wrong source canvas size")
	elif composite.get_data() != atlas.get_data():
		errors.append("Source composite differs from exported atlas")
	var ids = {}
	var colors = {}
	var transparent = 0
	for asset in params.assets:
		if ids.has(asset.id):
			errors.append("Duplicate ID: " + str(asset.id))
		ids[asset.id] = true
		var source = Image.load_from_file(root.path_join(str(asset.id) + ".png"))
		if source == null or source.is_empty():
			errors.append("Missing PNG: " + str(asset.id))
			continue
		source.convert(Image.FORMAT_RGBA8)
		var rect = asset.sourceRect
		var expected = atlas.get_region(Rect2i(int(rect.x),int(rect.y),int(rect.width),int(rect.height)))
		if source.get_size() != Vector2i(int(asset.frameSize.width),int(asset.frameSize.height)):
			errors.append("Wrong dimensions: " + str(asset.id))
		if source.get_data() != expected.get_data():
			errors.append("PNG differs from atlas: " + str(asset.id))
		for y in range(source.get_height()):
			for x in range(source.get_width()):
				var c = source.get_pixel(x,y)
				if c.a > 0.0:
					colors[c.to_html(true)] = true
					if c.a < 1.0:
						transparent += 1
	var booth = Image.create(80,72,false,Image.FORMAT_RGBA8)
	for asset in params.assets:
		if asset.id in ["booth-bench-left","booth-bench-right","booth-table"]:
			var piece = Image.load_from_file(root.path_join(str(asset.id) + ".png"))
			piece.convert(Image.FORMAT_RGBA8)
			booth.blend_rect(piece,Rect2i(0,0,piece.get_width(),piece.get_height()),Vector2i(int(asset.assemblyOffset.x),int(asset.assemblyOffset.y)))
	var approved = Image.load_from_file(str(params.approved_booth))
	approved.convert(Image.FORMAT_RGBA8)
	if approved.get_data() != booth.get_data():
		errors.append("Booth pieces do not reconstruct the approved original")
	return {"assets":ids.size(),"colors":colors.size(),"semitransparent_pixels":transparent,"source_layers":project.layers.size(),"source_frames":project.frames.size(),"booth_preserved":approved.get_data()==booth.get_data(),"errors":errors}

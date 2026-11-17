func run(api, image, project, params):
	var composite = api.get_composite_image()
	if project.size != Vector2i(512, 512) or composite.get_size() != project.size:
		return {"error": "Open the 512x512 front-of-house source project before exporting"}
	var output_dir = str(params.output_dir)
	var failure = DirAccess.make_dir_recursive_absolute(output_dir)
	if failure != OK:
		return {"error": "Cannot create output directory", "code": failure}
	var outputs = []
	for asset in params.assets:
		var region = asset.sourceRect
		var cut = composite.get_region(Rect2i(int(region.x), int(region.y), int(region.width), int(region.height)))
		var path = output_dir.path_join(str(asset.id) + ".png")
		var result = cut.save_png(path)
		if result != OK:
			return {"error": "Cannot export PNG", "path": path, "code": result}
		outputs.append(asset.id)
	var atlas_result = composite.save_png(output_dir.path_join("atlas.png"))
	return {"project": project.name, "exported": outputs.size(), "atlas_result": atlas_result}

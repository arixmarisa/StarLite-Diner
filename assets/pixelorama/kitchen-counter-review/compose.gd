func run(api, image, project, params):
	var output = Image.create(176,128,false,Image.FORMAT_RGBA8)
	output.fill(Color(0,0,0,0))
	for item in params.placements:
		if int(params.get("role",-1))>=0 and int(item.role)!=int(params.role):
			continue
		var piece=Image.load_from_file(str(params.output_dir).path_join(str(item.image)))
		output.blend_rect(piece,Rect2i(Vector2i.ZERO,piece.get_size()),Vector2i(int(item.x),int(item.y)))
	if bool(params.get("export",false)):
		output.save_png(str(params.output_dir).path_join("kitchen-counter-preview.png"))
		var enlarged=output.duplicate()
		enlarged.resize(1056,768,Image.INTERPOLATE_NEAREST)
		enlarged.save_png(str(params.source_dir).path_join("kitchen-counter-preview.png"))
		return {"preview_exported":true,"native_size":[176,128],"scale":6}
	return output

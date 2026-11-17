func run(api, image, project, params):
	var path=str(params.output_dir)
	var composite=api.get_composite_image()
	var native=Image.load_from_file(path.path_join("back-grill.png"))
	var shadow=api.get_layer_image("01 - contact shadow").duplicate()
	var body=Image.create(96,64,false,Image.FORMAT_RGBA8)
	body.fill(Color(0,0,0,0))
	for layer in project.layers:
		if layer.name!="01 - contact shadow":
			body.blend_rect(api.get_layer_image(layer.name),Rect2i(0,0,96,64),Vector2i.ZERO)
	var body_result=body.save_png(path.path_join("back-grill-body.png"))
	var shadow_result=shadow.save_png(path.path_join("back-grill-shadow.png"))
	var rebuilt=shadow.duplicate()
	rebuilt.blend_rect(body,Rect2i(0,0,96,64),Vector2i.ZERO)
	var surface_opaque=true
	for y in range(12,36):
		for x in range(10,86):
			if composite.get_pixel(x,y).a!=1.0:
				surface_opaque=false
	var sizes=[]
	for layer in project.layers:
		var cel=api.get_layer_image(layer.name)
		sizes.append({"name":layer.name,"size":str(cel.get_size()),"bounds":str(cel.get_used_rect())})
	return {"source_matches_native":composite.get_data()==native.get_data(),"components_rebuild_exactly":composite.get_data()==rebuilt.get_data(),"bare_cooking_surface_opaque":surface_opaque,"output_codes":[body_result,shadow_result],"layers":sizes}

func blank(w,h):
	var out=Image.create(w,h,false,Image.FORMAT_RGBA8)
	out.fill(Color(0,0,0,0))
	return out

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var active=root.get_node("Global").get("current_project")
	var source=str(params.source_dir)
	var output=str(params.output_dir)
	var repo=str(params.repo_dir)
	var plan=JSON.parse_string(FileAccess.get_file_as_string(source.path_join("furniture-fit.json")))
	var size=Vector2i(plan.canvas.width,plan.canvas.height)
	var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"customer-seated-furniture-fit",size)
	var frame=load("res://src/Classes/Frame.gd").new()
	var composite=blank(size.x,size.y)
	var colors=[]
	var index=0
	for command in plan.commands:
		var path=repo.path_join(command.path) if command.type=="image" else output.path_join(command.id+"-"+command.direction+"-seated.png")
		if not FileAccess.file_exists(path): return {"error":"Missing context input","path":path}
		var input=Image.load_from_file(path)
		var rect=Rect2i(0,0,input.get_width(),input.get_height())
		var point=Vector2i(command.x,command.y)
		if command.has("sourceRect"):
			rect=Rect2i(command.sourceRect.x,command.sourceRect.y,command.sourceRect.width,command.sourceRect.height)
			point+=Vector2i(command.destinationOffset.x,command.destinationOffset.y)
		if not Rect2i(Vector2i.ZERO,input.get_size()).encloses(rect) or not Rect2i(Vector2i.ZERO,size).encloses(Rect2i(point,rect.size)): return {"error":"Context rectangle bounds","command":command}
		var layer=blank(size.x,size.y)
		layer.blit_rect(input,rect,point)
		composite.blend_rect(layer,Rect2i(Vector2i.ZERO,size),Vector2i.ZERO)
		var name=str(index+1).pad_zeros(2)+" - "+(command.id+" "+command.direction if command.type=="actor" else str(command.path).get_file())
		var pixel_layer=load("res://src/Classes/Layers/PixelLayer.gd").new(target,name)
		target.layers.append(pixel_layer)
		frame.cels.append(pixel_layer.new_cel_from_image(layer))
		index+=1
	for y in range(size.y):
		for x in range(size.x):
			var color=composite.get_pixel(x,y)
			if color.a>0 and not colors.has(color): colors.append(color)
	target.frames.append(frame)
	target.current_frame=0
	target.current_layer=0
	target.fps=1
	var palette=load("res://src/Palette/Palette.gd").new("Customer and existing furniture context",12,ceili(colors.size()/12.0),"Unscaled existing furniture and independent seated actors")
	palette.is_project_palette=true
	for color in colors: palette.add_color(color)
	target.palettes[palette.name]=palette
	target.project_current_palette_name=palette.name
	target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new("static-seated-furniture-fit",Color("#ee75a3"),1,1))
	if not root.get_node("OpenSave").call("save_pxo_file",source.path_join("seated-furniture-context.pxo"),false,target): return {"error":"Context source save failed"}
	var zip=ZIPReader.new()
	if zip.open(source.path_join("seated-furniture-context.pxo"))!=OK: return {"error":"Context PXO invalid"}
	var rebuilt=blank(size.x,size.y)
	for li in range(index):
		var raw=zip.read_file("image_data/frames/1/layer_"+str(li+1))
		var cel=Image.create_from_data(size.x,size.y,false,Image.FORMAT_RGBA8,raw)
		rebuilt.blend_rect(cel,Rect2i(Vector2i.ZERO,size),Vector2i.ZERO)
	zip.close()
	if rebuilt.get_data()!=composite.get_data(): return {"error":"Context source composite mismatch"}
	composite.save_png(output.path_join("seated-furniture-context.png"))
	var zoom=composite.duplicate()
	zoom.resize(size.x*4,size.y*4,Image.INTERPOLATE_NEAREST)
	zoom.save_png(source.path_join("seated-furniture-context-preview.png"))
	zoom.save_png(output.path_join("seated-furniture-context-preview.png"))
	return {"nativeSize":[size.x,size.y],"layers":index,"actorScale":1,"previewScale":4,"activeProjectUnchanged":root.get_node("Global").get("current_project")==active}

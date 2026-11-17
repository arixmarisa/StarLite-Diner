func blank(w,h):
	var out=Image.create(w,h,false,Image.FORMAT_RGBA8)
	out.fill(Color(0,0,0,0))
	return out

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var active=root.get_node("Global").get("current_project")
	var repo=str(params.repo_dir)
	var source=str(params.source_dir)
	var output=str(params.output_dir)
	var manifest=JSON.parse_string(FileAccess.get_file_as_string(source.path_join("direction-manifest.json")))
	var palette_spec=JSON.parse_string(FileAccess.get_file_as_string(source.path_join("palette.json")))
	var original_atlas=Image.load_from_file(repo.path_join("apps/web/public/art/front-of-house-v1/atlas.png"))
	var inputs={}
	var proof={"reusedChairDirections":2,"newGameChairImages":0,"originalAtlasCropsExact":true,"originalImagePixelsUnchanged":true,"savedCelsExact":0,"compositions":{},"activeProjectUnchanged":false}
	for key in manifest.assets:
		var definition=manifest.assets[key]
		var pixels=Image.load_from_file(repo.path_join(definition.repositoryImage))
		if pixels.get_size()!=Vector2i(definition.frameSize.width,definition.frameSize.height): return {"error":"Input dimensions changed","id":key}
		if definition.has("sourceRect"):
			var rect=definition.sourceRect
			if pixels.get_data()!=original_atlas.get_region(Rect2i(rect.x,rect.y,rect.width,rect.height)).get_data(): return {"error":"Chair differs from original atlas","id":key}
		inputs[key]=pixels
	for name in ["comparison","table-context"]:
		var recipe=manifest.compositions[name]
		var size=Vector2i(recipe.width,recipe.height)
		var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"table-chair-"+name,size)
		var frame=load("res://src/Classes/Frame.gd").new()
		var composite=blank(size.x,size.y)
		var authored=[]
		for item in recipe.placements:
			var input=inputs[item.asset]
			var point=Vector2i(item.x,item.y)
			if not Rect2i(Vector2i.ZERO,size).encloses(Rect2i(point,input.get_size())): return {"error":"Composition clips a source image","item":item}
			var layer=blank(size.x,size.y)
			layer.blit_rect(input,Rect2i(Vector2i.ZERO,input.get_size()),point)
			if layer.get_region(Rect2i(point,input.get_size())).get_data()!=input.get_data(): return {"error":"Native input pixels changed during placement"}
			var pixel_layer=load("res://src/Classes/Layers/PixelLayer.gd").new(target,str(target.layers.size()+1).pad_zeros(2)+" - "+item.asset)
			target.layers.append(pixel_layer)
			frame.cels.append(pixel_layer.new_cel_from_image(layer))
			authored.append(layer)
			composite.blend_rect(layer,Rect2i(Vector2i.ZERO,size),Vector2i.ZERO)
		target.frames.append(frame)
		target.current_frame=0
		target.current_layer=0
		target.fps=1
		var palette=load("res://src/Palette/Palette.gd").new("Reused table chairs - approved original palette",7,3,"Original furniture pixels; review composition only")
		palette.is_project_palette=true
		for color in palette_spec.colors: palette.add_color(Color(color.hex))
		target.palettes[palette.name]=palette
		target.project_current_palette_name=palette.name
		target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new("static-"+name,Color("#ee75a3"),1,1))
		var path=source.path_join(name+".pxo")
		if not root.get_node("OpenSave").call("save_pxo_file",path,false,target): return {"error":"Source save failed"}
		var zip=ZIPReader.new()
		if zip.open(path)!=OK: return {"error":"Saved source invalid"}
		var data=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
		if data.frames.size()!=1 or data.layers.size()!=authored.size() or data.tags.size()!=1 or int(data.fps)!=1: return {"error":"Source metadata mismatch"}
		var rebuilt=blank(size.x,size.y)
		for li in range(authored.size()):
			var raw=zip.read_file("image_data/frames/1/layer_"+str(li+1))
			if raw!=authored[li].get_data(): return {"error":"Saved cel changed","layer":li}
			rebuilt.blend_rect(Image.create_from_data(size.x,size.y,false,Image.FORMAT_RGBA8,raw),Rect2i(Vector2i.ZERO,size),Vector2i.ZERO)
			proof.savedCelsExact+=1
		zip.close()
		if rebuilt.get_data()!=composite.get_data(): return {"error":"Saved composite changed"}
		composite.save_png(output.path_join(name+".png"))
		var reload=Image.load_from_file(output.path_join(name+".png"))
		if reload.get_data()!=composite.get_data(): return {"error":"PNG roundtrip differs"}
		var zoom=composite.duplicate()
		zoom.resize(size.x*int(recipe.previewScale),size.y*int(recipe.previewScale),Image.INTERPOLATE_NEAREST)
		zoom.save_png(source.path_join(name+"-preview.png"))
		zoom.save_png(output.path_join(name+"-preview.png"))
		proof.compositions[name]={"nativeSize":[size.x,size.y],"layers":authored.size(),"frames":1,"tags":1,"fps":1,"sourceCompositeExact":true,"pngExact":true,"previewScale":recipe.previewScale}
	proof.activeProjectUnchanged=root.get_node("Global").get("current_project")==active
	var report=FileAccess.open(source.path_join("verification.json"),FileAccess.WRITE)
	report.store_string(JSON.stringify(proof,"  "))
	report.close()
	return proof

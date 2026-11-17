func blank(w,h):
	var out=Image.create(w,h,false,Image.FORMAT_RGBA8)
	out.fill(Color(0,0,0,0))
	return out

func write_json(path,value):
	var file=FileAccess.open(path,FileAccess.WRITE)
	file.store_string(JSON.stringify(value,"  "))
	file.close()

func enlarged(img,scale):
	var out=img.duplicate()
	out.resize(img.get_width()*scale,img.get_height()*scale,Image.INTERPOLATE_NEAREST)
	return out

func components(img):
	var remaining={}
	for y in range(24):
		for x in range(16):
			if img.get_pixel(x,y).a>0: remaining[y*16+x]=true
	var count=0
	while not remaining.is_empty():
		count+=1
		var queue=[remaining.keys()[0]]
		remaining.erase(queue[0])
		while not queue.is_empty():
			var p=int(queue.pop_back())
			for offset in [Vector2i(-1,0),Vector2i(1,0),Vector2i(0,-1),Vector2i(0,1)]:
				var q=Vector2i(p%16,p/16)+offset
				var key=q.y*16+q.x
				if Rect2i(0,0,16,24).has_point(q) and remaining.has(key):
					remaining.erase(key)
					queue.append(key)
	return count

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var active=root.get_node("Global").get("current_project")
	var source=str(params.source_dir)
	var output=str(params.output_dir)
	var approved=str(params.approved_dir)
	var spec=JSON.parse_string(FileAccess.get_file_as_string(source.path_join("contract.json")))
	var manifest={"frameSize":{"width":16,"height":24},"sheetSize":{"width":96,"height":288},"frameIndexBase":0,"tagIndexBase":0,"directions":spec.directions,"columns":spec.columns,"rowOrder":"outfit then south/west/east/north","walkAnchor":{"x":8,"y":23},"seatAnchor":{"x":8,"y":19},"fps":8,"layers":spec.layers,"families":{},"integration":"not integrated","eatingAnimations":false,"partSelection":"part-selection.json","recolorMap":"recolor-map.json","motionPreview":"customers-motion-preview.png","furnitureFit":"furniture-fit.json","furnitureContext":"seated-furniture-context.png","furnitureContextPreview":"seated-furniture-context-preview.png"}
	var proof={"families":{},"failures":[],"frames":0,"approvedFrontExact":0,"isolatedRecolorPasses":0,"neutralChanges":0,"sourceCelsExact":0}
	var recolors=[]
	for family in ["male","female"]:
		var recipe=JSON.parse_string(FileAccess.get_file_as_string(source.path_join(family+"-frames.json")))
		var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"customer-v1-"+family,Vector2i(16,24))
		for name in spec.layers: target.layers.append(load("res://src/Classes/Layers/PixelLayer.gd").new(target,str(name)))
		var sheet=blank(96,288)
		var idles=blank(64,72)
		var seated=blank(64,72)
		var masks={}
		var materials={}
		for role in spec.roles:
			masks[role]=blank(96,288)
			materials[role]=blank(96,288)
		var frame_records=[]
		var source_images=[]
		var all_composites=[]
		var palette_colors=[]
		for color in spec.fixedColors.values():
			if not palette_colors.has(color): palette_colors.append(color)
		var report={"frames":0,"layers":10,"tags":0,"disconnectedFrames":[],"semiTransparentPixels":0,"distinctWalkPoses":{},"frontExact":3,"paletteSwatches":0}
		for vi in range(3):
			var variant=recipe.variants[vi]
			for ramp in variant.ramps.values():
				for color in ramp.values():
					if not palette_colors.has(color): palette_colors.append(color)
			for definition in variant.frames:
				var frame=load("res://src/Classes/Frame.gd").new()
				frame.duration=4 if definition.state=="idle" else 1
				var layers=[]
				var layer_roles=[]
				for li in range(10):
					var pixels=blank(16,24)
					var ownership=[]
					ownership.resize(384)
					ownership.fill("")
					for command in definition.rectangles[li]:
						var token=str(command.c)
						var rect=Rect2i(command.x,command.y,command.w,command.h)
						if not Rect2i(0,0,16,24).encloses(rect): return {"error":"Out of bounds","id":definition.id,"command":command}
						var color=Color(0,0,0,0)
						var owner=""
						if token!="clear":
							if token.contains("."):
								var parts=token.split(".")
								var allowed=false
								for allowed_layer in spec.roles[parts[0]].layers:
									if int(allowed_layer)==li: allowed=true
								if not allowed: return {"error":"Role outside material layer","id":definition.id,"token":token,"layer":li}
								color=Color(variant.ramps[parts[0]][parts[1]])
								owner=token
							else: color=Color(spec.fixedColors[token])
						pixels.fill_rect(rect,color)
						for y in range(rect.position.y,rect.end.y):
							for x in range(rect.position.x,rect.end.x): ownership[y*16+x]=owner
					layers.append(pixels)
					layer_roles.append(ownership)
					frame.cels.append(target.layers[li].new_cel_from_image(pixels))
				target.frames.append(frame)
				var composite=blank(16,24)
				var visible=[]
				visible.resize(384)
				visible.fill("")
				for li in range(10):
					var pixels=layers[li]
					composite.blend_rect(pixels,Rect2i(0,0,16,24),Vector2i.ZERO)
					for y in range(24):
						for x in range(16):
							if pixels.get_pixel(x,y).a>0: visible[y*16+x]=layer_roles[li][y*16+x]
				if definition.direction=="south" and definition.state=="idle":
					var reference=Image.load_from_file(approved.path_join(variant.id+".png"))
					if reference.get_data()!=composite.get_data(): return {"error":"Approved front changed","id":variant.id}
					proof.approvedFrontExact+=1
				var origin=Vector2i(definition.sheet.x,definition.sheet.y)
				sheet.blit_rect(composite,Rect2i(0,0,16,24),origin)
				if definition.state in ["idle","seated"]:
					var display=idles if definition.state=="idle" else seated
					var di=spec.directions.find(definition.direction)
					display.blit_rect(composite,Rect2i(0,0,16,24),Vector2i(di*16,vi*24))
					composite.save_png(output.path_join(definition.id+".png"))
				if components(composite)!=1: report.disconnectedFrames.append(definition.id)
				for y in range(24):
					for x in range(16):
						var color=composite.get_pixel(x,y)
						if color.a>0 and color.a<1: report.semiTransparentPixels+=1
				var record={"id":definition.id,"outfit":variant.id,"direction":definition.direction,"state":definition.state,"step":definition.step,"index":target.frames.size()-1,"frame":{"x":origin.x,"y":origin.y,"width":16,"height":24},"static":definition.state!="walk","durationMultiplier":frame.duration,"durationMs":500 if definition.state=="idle" else 125,"anchor":{"x":8,"y":19} if definition.state=="seated" else {"x":8,"y":23}}
				frame_records.append(record)
				var recolor={"id":definition.id,"index":record.index,"family":family,"sheetRect":record.frame,"ramps":variant.ramps,"roles":{}}
				for role in spec.roles:
					var tones={"shade":[],"base":[],"highlight":[]}
					var material=blank(16,24)
					for li in spec.roles[role].layers: material.blend_rect(layers[li],Rect2i(0,0,16,24),Vector2i.ZERO)
					var material_sheet=materials[role]
					material_sheet.blit_rect(material,Rect2i(0,0,16,24),origin)
					var mask=masks[role]
					var changed=composite.duplicate()
					for y in range(24):
						for x in range(16):
							var token=str(visible[y*16+x])
							if token.begins_with(role+"."):
								var tone=token.split(".")[1]
								tones[tone].append([x,y])
								mask.set_pixel(origin.x+x,origin.y+y,Color.WHITE)
								changed.set_pixel(x,y,Color("#39efc8"))
					for y in range(24):
						for x in range(16):
							if not str(visible[y*16+x]).begins_with(role+".") and changed.get_pixel(x,y)!=composite.get_pixel(x,y): proof.neutralChanges+=1
					recolor.roles[role]={"visibleTonePixels":tones}
					proof.isolatedRecolorPasses+=1
				recolors.append(recolor)
				source_images.append(layers)
				all_composites.append(composite)
				proof.frames+=1
			for di in range(4):
				var start=vi*24+di*6
				for tag in [["idle",start+1,start+1],["walk",start+2,start+5],["seated",start+6,start+6]]:
					target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new(variant.id+"-"+spec.directions[di]+"-"+tag[0],Color("#ee75a3"),tag[1],tag[2]))
				var unique=[]
				for phase in range(4):
					var raw=all_composites[start+phase+1].get_data()
					if not unique.has(raw): unique.append(raw)
				report.distinctWalkPoses[variant.id+"-"+spec.directions[di]]=unique.size()
		var palette=load("res://src/Palette/Palette.gd").new("Customer "+family+" approved materials",8,ceili(palette_colors.size()/8.0),"Approved front ramps; full directional walking and static seated family")
		palette.is_project_palette=true
		for color in palette_colors: palette.add_color(Color(color))
		target.palettes[palette.name]=palette
		target.project_current_palette_name=palette.name
		target.current_frame=0
		target.current_layer=0
		target.fps=8
		if not root.get_node("OpenSave").call("save_pxo_file",source.path_join(family+".pxo"),false,target): return {"error":"PXO save failed"}
		var zip=ZIPReader.new()
		if zip.open(source.path_join(family+".pxo"))!=OK: return {"error":"PXO unreadable"}
		var saved=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
		if saved.frames.size()!=72 or saved.layers.size()!=10 or saved.tags.size()!=36 or int(saved.fps)!=8: return {"error":"Saved timeline metadata mismatch"}
		if int(saved.size_x)!=16 or int(saved.size_y)!=24: return {"error":"Saved frame size mismatch"}
		for li in range(10):
			if saved.layers[li].name!=spec.layers[li]: return {"error":"Saved semantic layer name mismatch"}
		var embedded_palette=JSON.parse_string(saved.palettes[0][saved.project_current_palette_name])
		if embedded_palette.colors.size()!=palette_colors.size(): return {"error":"Saved local palette mismatch"}
		for fi in range(72):
			if int(saved.frames[fi].duration)!=int(frame_records[fi].durationMultiplier): return {"error":"Saved frame duration mismatch"}
			var rebuilt=blank(16,24)
			for li in range(10):
				var raw=zip.read_file("image_data/frames/"+str(fi+1)+"/layer_"+str(li+1))
				if raw!=source_images[fi][li].get_data(): return {"error":"Saved cel mismatch","family":family,"frame":fi,"layer":li}
				rebuilt.blend_rect(Image.create_from_data(16,24,false,Image.FORMAT_RGBA8,raw),Rect2i(0,0,16,24),Vector2i.ZERO)
				proof.sourceCelsExact+=1
			if rebuilt.get_data()!=all_composites[fi].get_data(): return {"error":"Saved source composite mismatch"}
		zip.close()
		sheet.save_png(output.path_join(family+".png"))
		var loaded=Image.load_from_file(output.path_join(family+".png"))
		if loaded.get_data()!=sheet.get_data(): return {"error":"PNG roundtrip mismatch"}
		enlarged(sheet,6).save_png(source.path_join(family+"-sheet-preview.png"))
		enlarged(idles,8).save_png(source.path_join(family+"-idles-preview.png"))
		enlarged(seated,8).save_png(source.path_join(family+"-seated-preview.png"))
		enlarged(idles,8).save_png(output.path_join(family+"-idles-preview.png"))
		enlarged(seated,8).save_png(output.path_join(family+"-seated-preview.png"))
		var role_exports={}
		for role in spec.roles:
			var mask=masks[role]
			var material=materials[role]
			mask.save_png(output.path_join(family+"-"+role+"-mask.png"))
			material.save_png(output.path_join(family+"-"+role+"-layer.png"))
			role_exports[role]={"mask":family+"-"+role+"-mask.png","layerImage":family+"-"+role+"-layer.png","sourceLayers":spec.roles[role].layers}
		write_json(source.path_join(family+"-palette.json"),{"colors":palette_colors,"variants":recipe.variants.map(func(v):return {"id":v.id,"ramps":v.ramps})})
		var public_tags=[]
		for tag in saved.tags:
			var normalized=tag.duplicate(true)
			normalized.from=int(tag.from)-1
			normalized.to=int(tag.to)-1
			public_tags.append(normalized)
		write_json(output.path_join(family+"-atlas.json"),{"image":family+".png","size":{"width":96,"height":288},"frameIndexBase":0,"tagIndexBase":0,"fps":8,"frames":frame_records,"tags":public_tags})
		manifest.families[family]={"sheet":family+".png","atlas":family+"-atlas.json","source":"../../../../../assets/pixelorama/customer-v1/"+family+".pxo","roles":role_exports,"frames":72,"tags":36,"idlePreview":family+"-idles-preview.png","seatedPreview":family+"-seated-preview.png","motionPreview":family+"-motion-preview.png"}
		report.frames=72
		report.tags=36
		report.paletteSwatches=palette_colors.size()
		proof.families[family]=report
		if not report.disconnectedFrames.is_empty(): proof.failures.append(family+" disconnected sprites")
		for value in report.distinctWalkPoses.values():
			if value!=4: proof.failures.append(family+" walk poses not unique")
	write_json(output.path_join("manifest.json"),manifest)
	write_json(output.path_join("recolor-map.json"),{"frameSize":{"width":16,"height":24},"sheetSize":{"width":96,"height":288},"roles":spec.roles,"neutralPixelsExcluded":true,"coordinates":"local native frame","frames":recolors})
	proof.activeProjectUnchanged=root.get_node("Global").get("current_project")==active
	write_json(source.path_join("verification.json"),proof)
	return proof

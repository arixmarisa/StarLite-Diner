func blend(target, upto = -1):
	var out = Image.create(16,24,false,Image.FORMAT_RGBA8)
	out.fill(Color(0,0,0,0))
	var count = target.layers.size() if upto < 0 else upto
	for i in range(count):
		out.blend_rect(target.frames[0].cels[i].get_image(),Rect2i(0,0,16,24),Vector2i.ZERO)
	return out

func project_new(name, width, height):
	return load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),name,Vector2i(width,height))

func add_palette_tag(target, spec, tag_name):
	var palette = load("res://src/Palette/Palette.gd").new("Player front - rose cream plum", 9, 2, "Shared booth colors plus existing player skin and hair")
	palette.is_project_palette = true
	for color in spec.palette:
		palette.add_color(Color(str(color)))
	target.palettes[palette.name] = palette
	target.project_current_palette_name = palette.name
	target.fps=1
	target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new(tag_name,Color("#ee75a3"),1,1))

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var global=root.get_node("Global")
	var active_before=global.get("current_project")
	var source_dir=str(params.source_dir)
	var output_dir=str(params.output_dir)
	var spec=JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("geometry.json")))
	var drawer_script=GDScript.new()
	drawer_script.source_code="extends RefCounted\n"+FileAccess.get_file_as_string(source_dir.path_join("draw.gd"))
	if drawer_script.reload()!=OK:
		return {"error":"Cannot compile draw recipe"}
	var drawer=drawer_script.new()
	var target=project_new("player-front",16,24)
	if target.frames.size()!=0 or target.layers.size()!=0:
		return {"error":"Expected private empty project"}
	var frame=load("res://src/Classes/Frame.gd").new()
	for role in range(spec.layers.size()):
		var layer=load("res://src/Classes/Layers/PixelLayer.gd").new(target,str(spec.layers[role]))
		var pixels=drawer.call("run",null,null,target,{"spec":spec,"role":role})
		if not pixels is Image or pixels.get_size()!=Vector2i(16,24):
			return {"error":"Wrong image size"}
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pixels))
	target.frames.append(frame)
	target.current_frame=0
	target.current_layer=0
	add_palette_tag(target,spec,"idle-south-review")
	var composite=blend(target)
	if not root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("player-front.pxo"),false,target):
		return {"error":"Native save failed"}
	var codes={}
	codes.native=composite.save_png(output_dir.path_join("player-front.png"))
	var preview=composite.duplicate()
	preview.resize(192,288,Image.INTERPOLATE_NEAREST)
	codes.preview=preview.save_png(source_dir.path_join("player-front-preview.png"))
	var role_data={}
	var isolation={}
	for role_name in ["skin","outfit"]:
		var definition=spec.roles[role_name]
		var index=int(definition.layer)
		var eligible=[]
		var tone_pixels={}
		for tone in definition.tones:
			eligible.append(str(definition.tones[tone]).trim_prefix("#").to_lower())
			tone_pixels[tone]=[]
		var original_layer=target.frames[0].cels[index].get_image()
		codes[role_name+"_layer"]=original_layer.save_png(output_dir.path_join(role_name+"-layer.png"))
		var mask=Image.create(16,24,false,Image.FORMAT_RGBA8)
		mask.fill(Color(0,0,0,0))
		var visible=0
		var restricted=true
		for y in range(24):
			for x in range(16):
				var color=composite.get_pixel(x,y)
				if color.a>0 and eligible.has(color.to_html(false)):
					mask.set_pixel(x,y,Color.WHITE)
					visible+=1
					for tone in definition.tones:
						if color==Color(str(definition.tones[tone])):
							tone_pixels[tone].append([x,y])
				for i in range(target.layers.size()):
					if i!=index:
						var candidate=target.frames[0].cels[i].get_image().get_pixel(x,y)
						if candidate.a>0 and eligible.has(candidate.to_html(false)):
							restricted=false
		codes[role_name+"_mask"]=mask.save_png(output_dir.path_join(role_name+"-mask.png"))
		var recolored=original_layer.duplicate()
		for y in range(24):
			for x in range(16):
				var current=recolored.get_pixel(x,y)
				if current.a>0 and eligible.has(current.to_html(false)):
					recolored.set_pixel(x,y,Color("#20b8b0") if role_name=="skin" else Color("#7b85dd"))
		var changed_composite=Image.create(16,24,false,Image.FORMAT_RGBA8)
		changed_composite.fill(Color(0,0,0,0))
		for i in range(target.layers.size()):
			var layer_image=recolored if i==index else target.frames[0].cels[i].get_image()
			changed_composite.blend_rect(layer_image,Rect2i(0,0,16,24),Vector2i.ZERO)
		var changed=0
		var outside=0
		for y in range(24):
			for x in range(16):
				if changed_composite.get_pixel(x,y)!=composite.get_pixel(x,y):
					changed+=1
					if mask.get_pixel(x,y).a==0:
						outside+=1
		role_data[role_name]={"layer":spec.layers[index],"layerIndex":index,"tones":definition.tones,"visibleTonePixels":tone_pixels,"mask":role_name+"-mask.png","layerImage":role_name+"-layer.png","neutralPixelsExcluded":true}
		isolation[role_name]={"visibleEligiblePixels":visible,"recoloredVisiblePixels":changed,"changedOutsideMask":outside,"toneColorsRestrictedToRoleLayer":restricted}
	var role_file=FileAccess.open(output_dir.path_join("recolor-map.json"),FileAccess.WRITE)
	role_file.store_string(JSON.stringify({"frameSize":{"width":16,"height":24},"roles":role_data}, "  "))
	role_file.close()
	var old_sheet=Image.load_from_file(str(params.original))
	var old_front=old_sheet.get_region(Rect2i(0,0,16,24))
	var compare=project_new("player-front-comparison",48,32)
	var compare_frame=load("res://src/Classes/Frame.gd").new()
	for entry in [[old_front,"01 - original front reference",4],[composite,"02 - revised front review",28]]:
		var layer=load("res://src/Classes/Layers/PixelLayer.gd").new(compare,entry[1])
		var pixels=Image.create(48,32,false,Image.FORMAT_RGBA8)
		pixels.fill(Color(0,0,0,0))
		pixels.blend_rect(entry[0],Rect2i(0,0,16,24),Vector2i(entry[2],4))
		compare.layers.append(layer)
		compare_frame.cels.append(layer.new_cel_from_image(pixels))
	compare.frames.append(compare_frame)
	compare.current_frame=0
	compare.current_layer=0
	add_palette_tag(compare,spec,"front-comparison-static")
	if not root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("player-front-comparison.pxo"),false,compare):
		return {"error":"Comparison save failed"}
	var comparison=Image.create(48,32,false,Image.FORMAT_RGBA8)
	comparison.fill(Color(0,0,0,0))
	for cel in compare.frames[0].cels:
		comparison.blend_rect(cel.get_image(),Rect2i(0,0,48,32),Vector2i.ZERO)
	codes.comparison=comparison.save_png(output_dir.path_join("player-front-comparison.png"))
	comparison.resize(480,320,Image.INTERPOLATE_NEAREST)
	codes.comparison_preview=comparison.save_png(source_dir.path_join("player-front-comparison-preview.png"))
	var zip=ZIPReader.new()
	if zip.open(source_dir.path_join("player-front.pxo"))!=OK:
		return {"error":"Saved ZIP cannot reopen"}
	var data=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var rebuilt=Image.create(16,24,false,Image.FORMAT_RGBA8)
	rebuilt.fill(Color(0,0,0,0))
	var cel_sizes=[]
	for i in range(1,10):
		var raw=zip.read_file("image_data/frames/1/layer_"+str(i))
		cel_sizes.append(raw.size())
		rebuilt.blend_rect(Image.create_from_data(16,24,false,Image.FORMAT_RGBA8,raw),Rect2i(0,0,16,24),Vector2i.ZERO)
	zip.close()
	var colors={}
	var opaque=0
	var semi=0
	var orphans=0
	for y in range(24):
		for x in range(16):
			var color=composite.get_pixel(x,y)
			if color.a==1:
				opaque+=1
				colors[color.to_html()]=true
				var neighbor=false
				for delta in [Vector2i(-1,0),Vector2i(1,0),Vector2i(0,-1),Vector2i(0,1)]:
					var p=Vector2i(x,y)+delta
					if Rect2i(0,0,16,24).has_point(p) and composite.get_pixelv(p).a>0:
						neighbor=true
				if not neighbor:
					orphans+=1
			elif color.a!=0:
				semi+=1
	var palette_data=JSON.parse_string(data.palettes[0].values()[0])
	return {"saved":true,"size":[data.size_x,data.size_y],"layers":data.layers.size(),"frames":data.frames.size(),"paletteSwatches":palette_data.colors.size(),"tag":data.tags[0].name,"celByteSizes":cel_sizes,"sourcePixelsMatchNative":rebuilt.get_data()==composite.get_data(),"activeProjectUnchanged":global.get("current_project")==active_before,"opaquePixels":opaque,"visibleColors":colors.size(),"semitransparentPixels":semi,"orphanPixels":orphans,"bounds":str(composite.get_used_rect()),"recolorIsolation":isolation,"exportCodes":codes}

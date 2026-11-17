func transparent(width,height):
	var out=Image.create(width,height,false,Image.FORMAT_RGBA8)
	out.fill(Color(0,0,0,0))
	return out

func blend(images):
	var out=transparent(16,24)
	for img in images:
		out.blend_rect(img,Rect2i(0,0,16,24),Vector2i.ZERO)
	return out

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var active_before=root.get_node("Global").get("current_project")
	var source_dir=str(params.source_dir)
	var output_dir=str(params.output_dir)
	var spec=JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("geometry.json")))
	var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"player-v3",Vector2i(16,24))
	if target.frames.size()!=0 or target.layers.size()!=0:
		return {"error":"Expected private empty project"}
	for name in spec.layers:
		target.layers.append(load("res://src/Classes/Layers/PixelLayer.gd").new(target,str(name)))
	var sheet=transparent(80,192)
	var role_sheets={"skin":transparent(80,192),"outfit":transparent(80,192)}
	var role_masks={"skin":transparent(80,192),"outfit":transparent(80,192)}
	var frame_records=[]
	var recolor_records=[]
	var role_data={"skin":{"layer":4,"layerName":spec.layers[4],"tones":spec.roles.skin.tones,"mask":"skin-mask.png","layerImage":"skin-layer.png"},"outfit":{"layer":3,"layerName":spec.layers[3],"tones":spec.roles.outfit.tones,"mask":"outfit-mask.png","layerImage":"outfit-layer.png"}}
	var all_frames=[]
	var all_images=[]
	for row in range(8):
		var direction=str(spec.rowOrder[row])
		var recipe=JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join(str(spec.directionalRecipes[direction]))))
		if recipe[direction].size()!=5:
			return {"error":"Expected idle+4walk recipes","direction":direction}
		for step in range(5):
			var definition=recipe[direction][step]
			if definition.rectangles.size()!=9:
				return {"error":"Expected nine semantic layer recipes"}
			var frame=load("res://src/Classes/Frame.gd").new()
			frame.duration=4 if step==0 else 1
			var layer_images=[]
			for layer_index in range(9):
				var pixels=transparent(16,24)
				for command in definition.rectangles[layer_index]:
					var rect=Rect2i(int(command.x),int(command.y),int(command.w),int(command.h))
					if rect.size.x<=0 or rect.size.y<=0 or not Rect2i(0,0,16,24).encloses(rect) or not spec.palette.has(str(command.color)):
						return {"error":"Invalid rectangle/palette","direction":direction,"step":step,"layer":layer_index,"command":command}
					pixels.fill_rect(rect,Color(str(command.color)))
				if pixels.get_used_rect().size==Vector2i.ZERO:
					return {"error":"Empty semantic layer","direction":direction,"step":step,"layer":layer_index}
				layer_images.append(pixels)
				frame.cels.append(target.layers[layer_index].new_cel_from_image(pixels))
			target.frames.append(frame)
			var composite=blend(layer_images)
			var frame_index=row*5+step
			var origin=Vector2i(step*16,row*24)
			sheet.blit_rect(composite,Rect2i(0,0,16,24),origin)
			all_frames.append(composite)
			all_images.append(layer_images)
			var role_frame={"index":frame_index,"direction":direction,"step":step,"sheetRect":{"x":origin.x,"y":origin.y,"width":16,"height":24},"roles":{}}
			for role_name in ["skin","outfit"]:
				var role=spec.roles[role_name]
				var index=int(role.layer)
				var tones={}
				var eligible=[]
				for tone in role.tones:
					tones[tone]=[]
					eligible.append(Color(str(role.tones[tone])))
				var mask=transparent(16,24)
				for y in range(24):
					for x in range(16):
						var color=composite.get_pixel(x,y)
						if color.a>0 and eligible.has(color):
							mask.set_pixel(x,y,Color.WHITE)
							for tone in role.tones:
								if color==Color(str(role.tones[tone])):
									tones[tone].append([x,y])
				role_sheets[role_name].blit_rect(layer_images[index],Rect2i(0,0,16,24),origin)
				role_masks[role_name].blit_rect(mask,Rect2i(0,0,16,24),origin)
				role_frame.roles[role_name]={"visibleTonePixels":tones}
			recolor_records.append(role_frame)
			frame_records.append({"index":frame_index,"x":origin.x,"y":origin.y,"width":16,"height":24,"direction":direction,"state":"idle" if step==0 else "walk","step":step,"durationMultiplier":frame.duration,"durationMs":500 if step==0 else 125})
	target.current_frame=0
	target.current_layer=0
	target.fps=8
	var pal=load("res://src/Palette/Palette.gd").new("Player v2 - approved rose cream plum",9,2,"Approved front palette; isolated skin and outfit ramps")
	pal.is_project_palette=true
	for color in spec.palette:
		pal.add_color(Color(str(color)))
	target.palettes[pal.name]=pal
	target.project_current_palette_name=pal.name
	var tags=[]
	for row in range(8):
		var direction=str(spec.rowOrder[row])
		for span in [["idle_"+direction,row*5+1,row*5+1],["walk_"+direction,row*5+2,row*5+5]]:
			target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new(span[0],Color("#ee75a3"),span[1],span[2]))
			tags.append({"name":span[0],"from":span[1]-1,"to":span[2]-1,"direction":"forward","color":"ee75a3"})
	var approved=Image.load_from_file(str(params.approved_front))
	if all_frames[0].get_data()!=approved.get_data():
		return {"error":"South idle differs from approved front; no save"}
	var previous_sheet=Image.load_from_file(str(params.cardinal_sheet))
	if sheet.get_region(Rect2i(0,0,80,96)).get_data()!=previous_sheet.get_data():
		return {"error":"Original cardinal frames changed; no save"}
	if not root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("player.pxo"),false,target):
		return {"error":"Native project save failed"}
	var saved_zip=ZIPReader.new()
	if saved_zip.open(source_dir.path_join("player.pxo"))!=OK:
		return {"error":"Saved PXO cannot be decoded"}
	for fi in range(40):
		for li in range(9):
			var raw=saved_zip.read_file("image_data/frames/"+str(fi+1)+"/layer_"+str(li+1))
			if raw!=all_images[fi][li].get_data():
				return {"error":"Saved cel differs from authored layer","frame":fi,"layer":li}
	saved_zip.close()
	var codes={}
	codes.sheet=sheet.save_png(output_dir.path_join("player.png"))
	codes.atlas=sheet.save_png(output_dir.path_join("player-atlas.png"))
	var preview=sheet.duplicate()
	preview.resize(480,1152,Image.INTERPOLATE_NEAREST)
	codes.preview=preview.save_png(source_dir.path_join("player-preview.png"))
	var idles=transparent(128,24)
	for row in range(8):
		idles.blit_rect(all_frames[row*5],Rect2i(0,0,16,24),Vector2i(row*16,0))
		codes["idle_"+str(spec.rowOrder[row])]=all_frames[row*5].save_png(output_dir.path_join("idle-"+str(spec.rowOrder[row])+".png"))
		var idle_preview=all_frames[row*5].duplicate()
		idle_preview.resize(192,288,Image.INTERPOLATE_NEAREST)
		codes["idle_preview_"+str(spec.rowOrder[row])]=idle_preview.save_png(source_dir.path_join("idle-"+str(spec.rowOrder[row])+"-preview.png"))
	codes.idles=idles.save_png(output_dir.path_join("player-idles.png"))
	idles.resize(768,144,Image.INTERPOLATE_NEAREST)
	codes.idle_preview=idles.save_png(source_dir.path_join("player-idles-preview.png"))
	for role_name in ["skin","outfit"]:
		codes[role_name+"_layer"]=role_sheets[role_name].save_png(output_dir.path_join(role_name+"-layer.png"))
		codes[role_name+"_mask"]=role_masks[role_name].save_png(output_dir.path_join(role_name+"-mask.png"))
	var recolor_file=FileAccess.open(output_dir.path_join("recolor-map.json"),FileAccess.WRITE)
	recolor_file.store_string(JSON.stringify({"frameSize":{"width":16,"height":24},"sheetSize":{"width":80,"height":192},"rowOrder":spec.rowOrder,"roles":role_data,"frames":recolor_records,"neutralPixelsExcluded":true},"  "))
	recolor_file.close()
	var ase_frames={}
	for record in frame_records:
		var key="player_"+str(record.index).pad_zeros(2)+"_"+str(record.direction)+"_"+str(record.state)
		ase_frames[key]={"frame":{"x":record.x,"y":record.y,"w":16,"h":24},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":16,"h":24},"sourceSize":{"w":16,"h":24},"duration":record.durationMs}
	var atlas_file=FileAccess.open(output_dir.path_join("player-atlas.json"),FileAccess.WRITE)
	atlas_file.store_string(JSON.stringify({"frames":ase_frames,"meta":{"app":"Pixelorama MCP native export recipe","version":"1","image":"player-atlas.png","format":"RGBA8888","size":{"w":80,"h":192},"scale":"1","frameTags":tags}},"  "))
	atlas_file.close()
	var records_file=FileAccess.open(source_dir.path_join("frame-records.json"),FileAccess.WRITE)
	records_file.store_string(JSON.stringify(frame_records,"  "))
	records_file.close()
	return {"saved":true,"frames":target.frames.size(),"layers":target.layers.size(),"tags":target.animation_tags.size(),"frontIdleExact":all_frames[0].get_data()==approved.get_data(),"sourceSize":[16,24],"sheetSize":[80,192],"activeProjectUnchanged":root.get_node("Global").get("current_project")==active_before,"exportCodes":codes}

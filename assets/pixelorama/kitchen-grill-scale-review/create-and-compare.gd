const W = 96
const H = 40

func blank(w,h):
	var picture = Image.create(w,h,false,Image.FORMAT_RGBA8)
	picture.fill(Color(0,0,0,0))
	return picture

func box(picture,x,y,w,h,color):
	picture.fill_rect(Rect2i(x,y,w,h),Color(color))

func project_save(root,global,tag_script,name,filename,pictures,names,swatches,tag):
	var size = pictures[0].get_size()
	var target = load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),name,size)
	var frame = load("res://src/Classes/Frame.gd").new()
	var complete = blank(size.x,size.y)
	for index in range(names.size()):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target,names[index])
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pictures[index]))
		complete.blend_rect(pictures[index],Rect2i(Vector2i.ZERO,size),Vector2i.ZERO)
	target.frames.append(frame)
	target.fps = 1
	target.current_frame = 0
	target.current_layer = 0
	frame.duration = 1.0
	var palette = load("res://src/Palette/Palette.gd").new(name,8,4,"Existing approved kitchen/player/floor colors")
	palette.is_project_palette = true
	for swatch in swatches.colors:
		palette.add_color(Color(str(swatch.hex)))
	target.palettes.clear()
	target.palettes[name] = palette
	target.project_current_palette_name = name
	target.animation_tags.append(tag_script.new(tag,Color("#ee75a3"),1,1))
	if not root.get_node("OpenSave").call("save_pxo_file",filename,false,target):
		return {"error":"Explicit native save failed"}
	var zip = ZIPReader.new()
	if zip.open(filename) != OK:
		return {"error":"Cannot reopen actual saved ZIP"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened = blank(size.x,size.y)
	var populated = 0
	var lengths = []
	for index in range(names.size()):
		var raw = zip.read_file("image_data/frames/1/layer_"+str(index+1))
		lengths.append(raw.size())
		if raw.size() != size.x*size.y*4:
			return {"error":"Saved cel length mismatch"}
		var cel = Image.create_from_data(size.x,size.y,false,Image.FORMAT_RGBA8,raw)
		if cel.get_used_rect().has_area():
			populated += 1
		reopened.blend_rect(cel,Rect2i(Vector2i.ZERO,size),Vector2i.ZERO)
	zip.close()
	var saved_palette = JSON.parse_string(data.palettes[0].values()[0])
	return {"image":complete,"report":{"sourceSize":[size.x,size.y],"sourceLayers":names.size(),"populatedLayers":populated,"celByteSizes":lengths,"frames":data.frames.size(),"fps":data.fps,"tag":data.tags[0].name,"paletteSwatches":saved_palette.colors.size(),"savedSourceMatchesComposite":reopened.get_data()==complete.get_data()}}

func write_json(path,value):
	var file = FileAccess.open(path,FileAccess.WRITE)
	file.store_string(JSON.stringify(value,"  ")+"\n")
	file.close()

func run(api,image,project,params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	var art_root = str(params.art_root)
	var tag_script = null
	for candidate in global.get("projects"):
		if candidate.animation_tags.size()>0:
			tag_script = candidate.animation_tags[0].get_script()
			break
	if tag_script == null:
		return {"error":"No native tag prototype"}
	var names = ["01 - contact shadow","02 - compact steel top cabinet and plinth","03 - low backsplash","04 - bare cooking plate","05 - grease channel","06 - controls and cabinet details","07 - chrome reflections and rose accent"]
	var pictures = []
	for name in names:
		pictures.append(blank(W,H))
	box(pictures[0],2,36,94,2,"#46404b")
	box(pictures[1],0,5,96,18,"#9ba8a5")
	box(pictures[1],0,5,96,1,"#322c38")
	box(pictures[1],0,6,96,1,"#d5dfd3")
	box(pictures[1],0,20,96,1,"#d5dfd3")
	box(pictures[1],0,21,96,1,"#676c70")
	box(pictures[1],0,22,96,1,"#322c38")
	box(pictures[1],0,23,96,10,"#676c70")
	box(pictures[1],0,23,96,1,"#322c38")
	box(pictures[1],1,24,94,1,"#9ba8a5")
	box(pictures[1],0,6,1,27,"#322c38")
	box(pictures[1],1,33,95,1,"#676c70")
	box(pictures[1],2,34,94,1,"#46404b")
	box(pictures[1],2,35,94,1,"#322c38")
	var top = Image.load_from_file(art_root.path_join("kitchen-counter-scale-review/steel-counter-top.png"))
	var face = Image.load_from_file(art_root.path_join("kitchen-counter-scale-review/steel-counter-front.png"))
	for yy in range(31):
		pictures[1].set_pixel(95,5+yy,top.get_pixel(0,yy) if yy<18 else face.get_pixel(0,yy-18))
	box(pictures[2],1,1,94,4,"#322c38")
	box(pictures[2],2,2,92,1,"#d5dfd3")
	box(pictures[2],2,3,92,1,"#9ba8a5")
	box(pictures[3],4,7,87,13,"#322c38")
	box(pictures[3],5,8,85,11,"#676c70")
	box(pictures[3],5,8,85,1,"#46404b")
	box(pictures[3],5,9,1,9,"#46404b")
	box(pictures[3],6,18,83,1,"#9ba8a5")
	box(pictures[4],4,20,87,2,"#322c38")
	box(pictures[4],5,20,85,1,"#46404b")
	box(pictures[4],6,21,83,1,"#676c70")
	for xx in [9,29,49,69]:
		box(pictures[5],xx,25,5,3,"#322c38")
		box(pictures[5],xx+1,25,3,1,"#d5dfd3")
		box(pictures[5],xx+1,26,2,1,"#9ba8a5")
	box(pictures[5],4,28,87,1,"#46404b")
	box(pictures[5],47,29,1,4,"#322c38")
	for xx in [17,60]:
		box(pictures[5],xx,30,18,2,"#322c38")
		box(pictures[5],xx+1,30,16,1,"#d5dfd3")
	box(pictures[6],2,8,1,11,"#d5dfd3")
	box(pictures[6],92,8,1,11,"#676c70")
	box(pictures[6],84,25,5,3,"#322c38")
	box(pictures[6],85,26,3,1,"#ee75a3")
	var palette = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var saved = project_save(root,global,tag_script,"kitchen-grill-scale",source_dir.path_join("kitchen-grill.pxo"),pictures,names,palette,"kitchen-grill-scale-static")
	if saved.has("error"):
		return saved
	var complete = saved.image
	complete.save_png(output_dir.path_join("kitchen-grill.png"))
	complete.save_png(output_dir.path_join("kitchen-grill-atlas.png"))
	var body = blank(W,H)
	for picture in pictures.slice(1):
		body.blend_rect(picture,Rect2i(0,0,W,H),Vector2i.ZERO)
	body.save_png(output_dir.path_join("kitchen-grill-body.png"))
	pictures[0].save_png(output_dir.path_join("kitchen-grill-shadow.png"))
	var preview = complete.duplicate()
	preview.resize(W*6,H*6,Image.INTERPOLATE_NEAREST)
	preview.save_png(source_dir.path_join("kitchen-grill-preview.png"))
	var qa = saved.report
	var join_mismatches = 0
	for yy in range(31):
		if complete.get_pixel(95,5+yy) != (top.get_pixel(0,yy) if yy<18 else face.get_pixel(0,yy-18)):
			join_mismatches += 1
	qa["rightJoinProfileMismatches"] = join_mismatches
	var rebuilt = pictures[0].duplicate()
	rebuilt.blend_rect(body,Rect2i(0,0,W,H),Vector2i.ZERO)
	qa["componentsReconstructExactly"] = rebuilt.get_data()==complete.get_data()
	qa["sourcePixelsMatchNativePng"] = complete.get_data()==Image.load_from_file(output_dir.path_join("kitchen-grill.png")).get_data()
	var semi = 0
	var opaque = 0
	var colors = {}
	for yy in range(H):
		for xx in range(W):
			var color = complete.get_pixel(xx,yy)
			if color.a>0:
				opaque += 1
				colors[color.to_html()] = true
				if color.a<1:
					semi += 1
	qa["opaquePixels"] = opaque
	qa["visibleColors"] = colors.size()
	qa["semitransparentPixels"] = semi
	var old_grill = Image.load_from_file(art_root.path_join("kitchen-grill-v2/kitchen-grill.png"))
	var old_counter = blank(32,40)
	var new_counter = blank(32,32)
	var old_root = art_root.path_join("kitchen-counter-review")
	var new_root = art_root.path_join("kitchen-counter-scale-review")
	for entry in [["steel-counter-top.png",Vector2i(0,0)],["steel-counter-front.png",Vector2i(0,24)],["steel-counter-end-right.png",Vector2i(16,0)]]:
		var part = Image.load_from_file(old_root.path_join(entry[0]))
		old_counter.blend_rect(part,Rect2i(Vector2i.ZERO,part.get_size()),entry[1])
	for entry in [["steel-counter-top.png",Vector2i(0,0)],["steel-counter-front.png",Vector2i(0,18)],["steel-counter-end-right.png",Vector2i(16,0)]]:
		var part = Image.load_from_file(new_root.path_join(entry[0]))
		new_counter.blend_rect(part,Rect2i(Vector2i.ZERO,part.get_size()),entry[1])
	old_counter.save_png(output_dir.path_join("original-counter-reference.png"))
	new_counter.save_png(output_dir.path_join("accepted-counter-reference.png"))
	var sheet = Image.load_from_file(art_root.path_join("player-v3/player.png"))
	var player_crop = sheet.get_region(Rect2i(0,48,16,24))
	var floor_tile = Image.load_from_file(art_root.path_join("front-of-house-v1/floor-checker.png"))
	var size = Vector2i(352,96)
	var floor_picture = blank(size.x,size.y)
	for yy in range(0,size.y,16):
		for xx in range(0,size.x,16):
			floor_picture.blend_rect(floor_tile,Rect2i(0,0,16,16),Vector2i(xx,yy))
	var comparison_names = ["01 - existing checker floor","02 - original grill","03 - original counter reference","04 - resized grill candidate","05 - accepted counter reference","06 - unchanged player original comparison","07 - unchanged player revised comparison"]
	var comparison_pictures = [floor_picture]
	for entry in [[old_grill,Vector2i(32,25)],[old_counter,Vector2i(128,41)],[complete,Vector2i(208,45)],[new_counter,Vector2i(304,50)],[player_crop,Vector2i(8,57)],[player_crop,Vector2i(184,57)]]:
		var picture = blank(size.x,size.y)
		picture.blend_rect(entry[0],Rect2i(Vector2i.ZERO,entry[0].get_size()),entry[1])
		comparison_pictures.append(picture)
	var comparison_palette = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("comparison-palette.json")))
	var compared = project_save(root,global,tag_script,"grill-scale-comparison",source_dir.path_join("comparison.pxo"),comparison_pictures,comparison_names,comparison_palette,"grill-scale-comparison-static")
	if compared.has("error"):
		return compared
	compared.image.save_png(output_dir.path_join("comparison.png"))
	var enlarged = compared.image.duplicate()
	enlarged.resize(size.x*3,size.y*3,Image.INTERPOLATE_NEAREST)
	enlarged.save_png(source_dir.path_join("comparison-preview.png"))
	enlarged.save_png(output_dir.path_join("comparison-preview.png"))
	var comparison_qa = compared.report
	comparison_qa["leftPlayerUnchanged"] = comparison_pictures[5].get_region(Rect2i(8,57,16,24)).get_data()==player_crop.get_data()
	comparison_qa["rightPlayerUnchanged"] = comparison_pictures[6].get_region(Rect2i(184,57,16,24)).get_data()==player_crop.get_data()
	comparison_qa["commonFloorContactRow"] = 80
	comparison_qa["candidateCounterWorktopY"] = 50
	comparison_qa["candidateGrillWorktopY"] = 50
	comparison_qa["candidateFrontTopY"] = 68
	qa["activeProjectUnchanged"] = global.get("current_project")==active_before
	comparison_qa["activeProjectUnchanged"] = qa.activeProjectUnchanged
	write_json(output_dir.path_join("verification.json"),qa)
	write_json(output_dir.path_join("comparison-verification.json"),comparison_qa)
	return {"candidate":qa,"comparison":comparison_qa}

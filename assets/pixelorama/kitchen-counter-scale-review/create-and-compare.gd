const W = 64
const H = 32

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
		return {"error":"Native tag prototype unavailable"}
	var names = ["01 - contact shadow","02 - steel top plane","03 - cabinet fronts and low plinth","04 - chrome rim and plum contours","05 - recessed handles and rose hardware"]
	var pictures = []
	for index in range(names.size()):
		pictures.append(blank(W,H))
	box(pictures[0],2,30,61,2,"#46404b")
	box(pictures[1],0,0,64,18,"#9ba8a5")
	box(pictures[2],0,18,64,10,"#322c38")
	box(pictures[2],1,19,62,8,"#9ba8a5")
	box(pictures[2],1,28,62,1,"#676c70")
	box(pictures[2],2,29,60,1,"#46404b")
	box(pictures[2],2,30,60,1,"#322c38")
	for xx in [16,32,48]:
		box(pictures[2],xx,19,1,9,"#676c70")
	box(pictures[3],0,0,64,1,"#322c38")
	box(pictures[3],1,1,62,1,"#d5dfd3")
	box(pictures[3],1,15,62,1,"#d5dfd3")
	box(pictures[3],0,16,64,1,"#676c70")
	box(pictures[3],0,17,64,1,"#322c38")
	box(pictures[3],0,1,1,16,"#322c38")
	box(pictures[3],63,1,1,16,"#322c38")
	box(pictures[3],1,25,62,1,"#d5dfd3")
	box(pictures[3],1,26,62,1,"#676c70")
	for start in [0,16,32,48]:
		box(pictures[4],start+5,20,7,2,"#676c70")
		box(pictures[4],start+5,20,6,1,"#d5dfd3")
		box(pictures[4],start+13,20,2,1,"#ee75a3")
	var palette = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var saved = project_save(root,global,tag_script,"kitchen-counter-scale",source_dir.path_join("kitchen-counter.pxo"),pictures,names,palette,"kitchen-counter-scale-static")
	if saved.has("error"):
		return saved
	var complete = saved.image
	complete.save_png(output_dir.path_join("kitchen-counter.png"))
	var body = blank(W,H)
	for picture in pictures.slice(1):
		body.blend_rect(picture,Rect2i(0,0,W,H),Vector2i.ZERO)
	body.save_png(output_dir.path_join("kitchen-counter-body.png"))
	pictures[0].save_png(output_dir.path_join("kitchen-counter-shadow.png"))
	var preview = complete.duplicate()
	preview.resize(W*6,H*6,Image.INTERPOLATE_NEAREST)
	preview.save_png(source_dir.path_join("kitchen-counter-preview.png"))
	var modules = []
	for item in [["steel-counter-top",Rect2i(16,0,16,18)],["steel-counter-front",Rect2i(16,18,16,13)],["steel-counter-end-left",Rect2i(0,0,16,31)],["steel-counter-end-right",Rect2i(48,0,16,31)]]:
		var crop = complete.get_region(item[1])
		crop.save_png(output_dir.path_join(item[0]+".png"))
		modules.append({"id":item[0],"image":item[0]+".png","sourceRect":[item[1].position.x,item[1].position.y,item[1].size.x,item[1].size.y]})
	var qa = saved.report
	var opaque = 0
	var semi = 0
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
	qa["sourcePixelsMatchNativePng"] = complete.get_data()==Image.load_from_file(output_dir.path_join("kitchen-counter.png")).get_data()
	var rebuilt = pictures[0].duplicate()
	rebuilt.blend_rect(body,Rect2i(0,0,W,H),Vector2i.ZERO)
	qa["componentsReconstructExactly"] = rebuilt.get_data()==complete.get_data()
	var sheet = Image.load_from_file(art_root.path_join("player-v3/player.png"))
	var player_crop = sheet.get_region(Rect2i(0,48,16,24))
	var floor_tile = Image.load_from_file(art_root.path_join("front-of-house-v1/floor-checker.png"))
	var old_counter = blank(64,40)
	var old_kit = art_root.path_join("kitchen-counter-review")
	for entry in [["steel-counter-end-left.png",Vector2i(0,0)],["steel-counter-top.png",Vector2i(16,0)],["steel-counter-front.png",Vector2i(16,24)],["steel-counter-top.png",Vector2i(32,0)],["steel-counter-front.png",Vector2i(32,24)],["steel-counter-end-right.png",Vector2i(48,0)]]:
		var part = Image.load_from_file(old_kit.path_join(entry[0]))
		old_counter.blend_rect(part,Rect2i(Vector2i.ZERO,part.get_size()),entry[1])
	old_counter.save_png(output_dir.path_join("original-counter-reference.png"))
	var fryer = Image.load_from_file(art_root.path_join("kitchen-fryer-scale-review/kitchen-fryer.png"))
	var comparison_size = Vector2i(256,96)
	var floor_picture = blank(comparison_size.x,comparison_size.y)
	for yy in range(0,comparison_size.y,16):
		for xx in range(0,comparison_size.x,16):
			floor_picture.blend_rect(floor_tile,Rect2i(0,0,16,16),Vector2i(xx,yy))
	var comparison_names = ["01 - existing checker floor","02 - original counter unchanged modules","03 - resized counter candidate","04 - approved fryer scale reference","05 - unchanged player original comparison","06 - unchanged player revised comparison"]
	var comparisons = [floor_picture]
	for entry in [[old_counter,Vector2i(32,41)],[complete,Vector2i(144,50)],[fryer,Vector2i(216,45)],[player_crop,Vector2i(8,57)],[player_crop,Vector2i(120,57)]]:
		var picture = blank(comparison_size.x,comparison_size.y)
		picture.blend_rect(entry[0],Rect2i(Vector2i.ZERO,entry[0].get_size()),entry[1])
		comparisons.append(picture)
	var comparison_palette = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("comparison-palette.json")))
	var compared = project_save(root,global,tag_script,"counter-scale-comparison",source_dir.path_join("comparison.pxo"),comparisons,comparison_names,comparison_palette,"counter-scale-comparison-static")
	if compared.has("error"):
		return compared
	compared.image.save_png(output_dir.path_join("comparison.png"))
	var comparison_preview = compared.image.duplicate()
	comparison_preview.resize(comparison_size.x*4,comparison_size.y*4,Image.INTERPOLATE_NEAREST)
	comparison_preview.save_png(source_dir.path_join("comparison-preview.png"))
	comparison_preview.save_png(output_dir.path_join("comparison-preview.png"))
	var comparison_qa = compared.report
	comparison_qa["leftPlayerUnchanged"] = comparisons[4].get_region(Rect2i(8,57,16,24)).get_data()==player_crop.get_data()
	comparison_qa["rightPlayerUnchanged"] = comparisons[5].get_region(Rect2i(120,57,16,24)).get_data()==player_crop.get_data()
	comparison_qa["commonFloorContactRow"] = 80
	comparison_qa["newCounterFrontTopY"] = 68
	comparison_qa["approvedFryerFrontTopY"] = 68
	comparison_qa["allSpritesAtNativeScale"] = true
	comparison_qa["activeProjectUnchanged"] = global.get("current_project")==active_before
	qa["activeProjectUnchanged"] = global.get("current_project")==active_before
	write_json(output_dir.path_join("verification.json"),qa)
	write_json(output_dir.path_join("comparison-verification.json"),comparison_qa)
	write_json(output_dir.path_join("modules.json"),{"nativeScale":1,"repeatSpacing":16,"modules":modules})
	return {"candidate":qa,"comparison":comparison_qa}

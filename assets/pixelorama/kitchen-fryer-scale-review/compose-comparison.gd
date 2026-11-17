const W = 176
const H = 96

func blank():
	var output = Image.create(W,H,false,Image.FORMAT_RGBA8)
	output.fill(Color(0,0,0,0))
	return output

func run(api,image,project,params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	var art_root = str(params.art_root)
	var tag_script = null
	for candidate in global.get("projects"):
		if candidate.animation_tags.size() > 0:
			tag_script = candidate.animation_tags[0].get_script()
			break
	if tag_script == null:
		return {"error":"No native animation-tag prototype"}
	var old_body = Image.load_from_file(art_root.path_join("kitchen-fryer-review/kitchen-fryer-body.png"))
	var old_shadow = Image.load_from_file(art_root.path_join("kitchen-fryer-review/kitchen-fryer-shadow.png"))
	var new_body = Image.load_from_file(output_dir.path_join("kitchen-fryer-body.png"))
	var new_shadow = Image.load_from_file(output_dir.path_join("kitchen-fryer-shadow.png"))
	var player_sheet = Image.load_from_file(art_root.path_join("player-v3/player.png"))
	var player_crop = player_sheet.get_region(Rect2i(0,48,16,24))
	var floor_tile = Image.load_from_file(art_root.path_join("front-of-house-v1/floor-checker.png"))
	var floor_picture = blank()
	for yy in range(0,H,16):
		for xx in range(0,W,16):
			floor_picture.blend_rect(floor_tile,Rect2i(0,0,16,16),Vector2i(xx,yy))
	var names = ["01 - existing checker floor","02 - original fryer contact shadow","03 - original fryer unchanged body","04 - compact fryer contact shadow","05 - compact fryer body","06 - unchanged player original comparison","07 - unchanged player revised comparison"]
	var pictures = [floor_picture]
	for entry in [[old_shadow,Vector2i(32,17)],[old_body,Vector2i(32,17)],[new_shadow,Vector2i(124,45)],[new_body,Vector2i(124,45)],[player_crop,Vector2i(12,57)],[player_crop,Vector2i(100,57)]]:
		var picture = blank()
		picture.blend_rect(entry[0],Rect2i(Vector2i.ZERO,entry[0].get_size()),entry[1])
		pictures.append(picture)
	var target = load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"fryer-scale-comparison",Vector2i(W,H))
	var frame = load("res://src/Classes/Frame.gd").new()
	var complete = blank()
	for index in range(names.size()):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target,names[index])
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pictures[index]))
		complete.blend_rect(pictures[index],Rect2i(0,0,W,H),Vector2i.ZERO)
	target.frames.append(frame)
	target.fps = 1
	target.current_frame = 0
	target.current_layer = 0
	frame.duration = 1.0
	var swatches = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("comparison-palette.json")))
	var palette = load("res://src/Palette/Palette.gd").new("Existing fryer player and floor palette",8,4,"Union of unchanged approved source swatches")
	palette.is_project_palette = true
	for swatch in swatches.colors:
		palette.add_color(Color(str(swatch.hex)))
	target.palettes.clear()
	target.palettes["Existing fryer player and floor palette"] = palette
	target.project_current_palette_name = "Existing fryer player and floor palette"
	target.animation_tags.append(tag_script.new("fryer-scale-comparison-static",Color("#ee75a3"),1,1))
	var saved = root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("comparison.pxo"),false,target)
	if not saved:
		return {"error":"Explicit comparison project save failed"}
	complete.save_png(output_dir.path_join("comparison.png"))
	var preview = complete.duplicate()
	preview.resize(W*6,H*6,Image.INTERPOLATE_NEAREST)
	preview.save_png(source_dir.path_join("comparison-preview.png"))
	preview.save_png(output_dir.path_join("comparison-preview.png"))
	var revised_pair = complete.get_region(Rect2i(88,32,88,64))
	revised_pair.save_png(output_dir.path_join("revised-pair.png"))
	revised_pair.resize(88*6,64*6,Image.INTERPOLATE_NEAREST)
	revised_pair.save_png(source_dir.path_join("revised-pair-preview.png"))
	var zip = ZIPReader.new()
	if zip.open(source_dir.path_join("comparison.pxo")) != OK:
		return {"error":"Cannot reopen saved comparison"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var rebuilt = blank()
	var cel_lengths = []
	for index in range(names.size()):
		var bytes = zip.read_file("image_data/frames/1/layer_"+str(index+1))
		cel_lengths.append(bytes.size())
		if bytes.size() != W*H*4:
			return {"error":"Saved comparison cel has wrong size","layer":index}
		var cel_picture = Image.create_from_data(W,H,false,Image.FORMAT_RGBA8,bytes)
		rebuilt.blend_rect(cel_picture,Rect2i(0,0,W,H),Vector2i.ZERO)
	zip.close()
	var saved_palette = JSON.parse_string(data.palettes[0].values()[0])
	var result = {"sourceSize":[data.size_x,data.size_y],"sourceLayers":data.layers.size(),"frames":data.frames.size(),"fps":data.fps,"tag":data.tags[0].name,"paletteSwatches":saved_palette.colors.size(),"celByteSizes":cel_lengths,"savedSourceMatchesPng":rebuilt.get_data()==complete.get_data(),"leftPlayerUnchanged":pictures[5].get_region(Rect2i(12,57,16,24)).get_data()==player_crop.get_data(),"rightPlayerUnchanged":pictures[6].get_region(Rect2i(100,57,16,24)).get_data()==player_crop.get_data(),"playerFrame":[0,48,16,24],"commonFootContactRow":80,"originalFryerFootContact":[32+20,17+63],"revisedFryerFootContact":[124+12,45+35],"playerFootContacts":[[20,80],[108,80]],"allSpritesAtNativeScale":true,"activeProjectUnchanged":global.get("current_project")==active_before}
	var report = FileAccess.open(output_dir.path_join("comparison-verification.json"),FileAccess.WRITE)
	report.store_string(JSON.stringify(result,"  ")+"\n")
	report.close()
	return result

# Execute inside Pixelorama MCP. Existing native images are copied at 1x only.
const SIZE = Vector2i(176,80)
const GRILL_ORIGIN = Vector2i(72,11)
const COUNTER_ORIGIN = Vector2i(8,16)
const TRAY_ORIGINS = [Vector2i(13,19),Vector2i(32,19),Vector2i(51,19)]
const FOOD_ORIGINS = [Vector2i(15,20),Vector2i(34,20),Vector2i(53,20)]

func blank(size):
	var output = Image.create(size.x,size.y,false,Image.FORMAT_RGBA8)
	output.fill(Color(0,0,0,0))
	return output

func placed(size, source, point):
	var output = blank(size)
	output.blend_rect(source,Rect2i(Vector2i.ZERO,source.get_size()),point)
	return output

func merge(pictures):
	var output = blank(pictures[0].get_size())
	for picture in pictures:
		output.blend_rect(picture,Rect2i(Vector2i.ZERO,picture.get_size()),Vector2i.ZERO)
	return output

func write_json(path,data):
	var file = FileAccess.open(path,FileAccess.WRITE)
	file.store_string(JSON.stringify(data,"  ")+"\n")
	file.close()

func tray_layers():
	var size = Vector2i(16,12)
	var shadow = blank(size)
	shadow.fill_rect(Rect2i(2,10,13,2),Color("#46404b"))
	var body = blank(size)
	body.fill_rect(Rect2i(1,0,14,11),Color("#322c38"))
	body.fill_rect(Rect2i(0,1,16,9),Color("#322c38"))
	body.fill_rect(Rect2i(1,1,14,9),Color("#9ba8a5"))
	body.fill_rect(Rect2i(2,2,12,7),Color("#d5dfd3"))
	var reflections = blank(size)
	reflections.fill_rect(Rect2i(2,1,12,1),Color("#fff0d5"))
	reflections.fill_rect(Rect2i(1,2,1,6),Color("#d5dfd3"))
	reflections.fill_rect(Rect2i(2,9,12,1),Color("#676c70"))
	return [shadow,body,reflections]

func save_project(root,tag_script,source_dir,output_dir,name,pictures,names,swatches):
	var size = pictures[0].get_size()
	var target = load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),name,size)
	var frame = load("res://src/Classes/Frame.gd").new()
	for i in range(names.size()):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target,names[i])
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pictures[i]))
	target.frames.append(frame)
	target.current_frame = 0
	target.current_layer = 0
	target.fps = 1
	frame.duration = 1.0
	var palette = load("res://src/Palette/Palette.gd").new(name,8,2,"Approved kitchen palette plus unchanged checker floor colors")
	palette.is_project_palette = true
	for swatch in swatches.colors:
		palette.add_color(Color(str(swatch.hex)))
	target.palettes.clear()
	target.palettes[name] = palette
	target.project_current_palette_name = name
	target.animation_tags.append(tag_script.new(name+"-static",Color("#ee75a3"),1,1))
	var complete = merge(pictures)
	var saved = root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join(name+".pxo"),false,target)
	if not saved: return {"error":"Explicit native source save failed"}
	var code = complete.save_png(output_dir.path_join(name+".png"))
	var zip = ZIPReader.new()
	if zip.open(source_dir.path_join(name+".pxo")) != OK: return {"error":"Cannot reopen saved native ZIP"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened = blank(size)
	var lengths = []
	var populated = []
	var exact_cels = true
	for i in range(names.size()):
		var raw = zip.read_file("image_data/frames/1/layer_"+str(i+1))
		lengths.append(raw.size())
		if raw.size() != size.x*size.y*4:
			zip.close()
			return {"error":"Saved full-size RGBA cel mismatch","layer":i}
		var picture = Image.create_from_data(size.x,size.y,false,Image.FORMAT_RGBA8,raw)
		populated.append(picture.get_used_rect().has_area())
		exact_cels = exact_cels and raw == pictures[i].get_data()
		reopened.blend_rect(picture,Rect2i(Vector2i.ZERO,size),Vector2i.ZERO)
	zip.close()
	var saved_palette = JSON.parse_string(data.palettes[0].values()[0])
	var native = Image.load_from_file(output_dir.path_join(name+".png"))
	return {"report":{"sourceSize":[data.size_x,data.size_y],"layerNames":names,"populatedLayers":populated,"celByteSizes":lengths,"sourceCelsMatchAuthoredLayers":exact_cels,"sourceMatchesNativePng":reopened.get_data()==native.get_data(),"paletteSwatches":saved_palette.colors.size(),"frames":data.frames.size(),"fps":data.fps,"frameDuration":data.frames[0].duration,"tag":data.tags[0].name,"exportCode":code}}

func run(api,image,project,params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var bound_before = image.duplicate() if image is Image else null
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	var art_root = str(params.art_root)
	var assets_root = str(params.assets_root)
	var tag_script = null
	for candidate in global.get("projects"):
		if candidate.animation_tags.size() > 0:
			tag_script = candidate.animation_tags[0].get_script()
			break
	if tag_script == null: return {"error":"No native static tag prototype available"}
	var swatches = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var grill_zip = ZIPReader.new()
	if grill_zip.open(assets_root.path_join("kitchen-grill-scale-review/kitchen-grill.pxo")) != OK:
		return {"error":"Approved native grill source unavailable"}
	var grill_data = JSON.parse_string(grill_zip.read_file("data.json").get_string_from_utf8())
	if grill_data.size_x != 96 or grill_data.size_y != 40 or grill_data.layers.size() != 7:
		grill_zip.close()
		return {"error":"Approved grill native dimensions/layers changed"}
	var grill_layers = []
	for i in range(7):
		var raw = grill_zip.read_file("image_data/frames/1/layer_"+str(i+1))
		if raw.size() != 96*40*4:
			grill_zip.close()
			return {"error":"Approved grill cel dimensions changed"}
		grill_layers.append(Image.create_from_data(96,40,false,Image.FORMAT_RGBA8,raw))
	grill_zip.close()
	var original_grill = merge(grill_layers)
	var reference_grill = Image.load_from_file(art_root.path_join("kitchen-grill-scale-review/kitchen-grill.png"))
	if original_grill.get_data() != reference_grill.get_data(): return {"error":"Saved approved grill does not match its native PNG"}
	var floor_tile = Image.load_from_file(art_root.path_join("front-of-house-v1/floor-checker.png"))
	if floor_tile.get_size() != Vector2i(16,16): return {"error":"Expected unchanged16px checker tile"}
	var floor_layer = blank(SIZE)
	for y in range(0,SIZE.y,16):
		for x in range(0,SIZE.x,16):
			floor_layer.blend_rect(floor_tile,Rect2i(0,0,16,16),Vector2i(x,y))
	var top = Image.load_from_file(art_root.path_join("kitchen-counter-scale-review/steel-counter-top.png"))
	var front = Image.load_from_file(art_root.path_join("kitchen-counter-scale-review/steel-counter-front.png"))
	var end_left = Image.load_from_file(art_root.path_join("kitchen-counter-scale-review/steel-counter-end-left.png"))
	var shadow = Image.load_from_file(art_root.path_join("kitchen-counter-scale-review/kitchen-counter-shadow.png"))
	var counter_top = blank(Vector2i(64,32))
	var counter_front = blank(Vector2i(64,32))
	counter_top.blend_rect(end_left,Rect2i(0,0,16,18),Vector2i.ZERO)
	counter_front.blend_rect(end_left,Rect2i(0,18,16,13),Vector2i(0,18))
	for x in [16,32,48]:
		counter_top.blend_rect(top,Rect2i(0,0,16,18),Vector2i(x,0))
		counter_front.blend_rect(front,Rect2i(0,0,16,13),Vector2i(x,18))
	var counter = merge([shadow,counter_top,counter_front])
	var small_tray_layers = tray_layers()
	var small_tray = merge(small_tray_layers)
	var tray_layer = blank(SIZE)
	for mount in TRAY_ORIGINS:
		tray_layer.blend_rect(small_tray,Rect2i(0,0,16,12),mount)
	var names = ["01 - unchanged native mint cream checker floor","02 - native counter contact shadow","03 - native left counter top and open grill join","04 - native counter cabinet fronts and plinth"]
	var pictures = [floor_layer,placed(SIZE,shadow,COUNTER_ORIGIN),placed(SIZE,counter_top,COUNTER_ORIGIN),placed(SIZE,counter_front,COUNTER_ORIGIN)]
	for i in range(7):
		names.append(str(i+5).pad_zeros(2)+" - preserved grill "+str(grill_data.layers[i].name))
		pictures.append(placed(SIZE,grill_layers[i],GRILL_ORIGIN))
	names.append("12 - three reusable ingredient trays")
	pictures.append(tray_layer)
	var food_names = ["raw-patty","raw-sausage","pancake-batter"]
	var foods = []
	for i in range(3):
		var path = art_root.path_join("grill-station-ingredients-v2/"+food_names[i]+".png")
		if not FileAccess.file_exists(path): return {"error":"Native ingredient not ready","path":path}
		var food = Image.load_from_file(path)
		if food.get_size() != Vector2i(12,10): return {"error":"Ingredient must remain12x10 native"}
		foods.append(food)
		names.append(str(i+13)+" - independent native "+food_names[i])
		pictures.append(placed(SIZE,food,FOOD_ORIGINS[i]))
	DirAccess.make_dir_recursive_absolute(source_dir)
	DirAccess.make_dir_recursive_absolute(output_dir)
	var tray_palette = {"colors":swatches.colors.slice(0,14)}
	var tray_result = save_project(root,tag_script,source_dir,output_dir,"ingredient-tray",small_tray_layers,["01 - tray contact shadow","02 - shallow recessed steel tray","03 - top light and near rim"],tray_palette)
	if tray_result.has("error"): return tray_result
	var scene_result = save_project(root,tag_script,source_dir,output_dir,"grill-station-scene",pictures,names,swatches)
	if scene_result.has("error"): return scene_result
	var complete = merge(pictures)
	var exports = {}
	exports["counter-assembly.png"] = counter.save_png(output_dir.path_join("counter-assembly.png"))
	exports["scene-floor.png"] = floor_layer.save_png(output_dir.path_join("scene-floor.png"))
	var preview = complete.duplicate()
	preview.resize(SIZE.x*6,SIZE.y*6,Image.INTERPOLATE_NEAREST)
	exports["sourcePreview"] = preview.save_png(source_dir.path_join("grill-station-scene-preview.png"))
	exports["publicPreview"] = preview.save_png(output_dir.path_join("grill-station-scene-preview.png"))
	var rebuilt = floor_layer.duplicate()
	rebuilt.blend_rect(counter,Rect2i(0,0,64,32),COUNTER_ORIGIN)
	rebuilt.blend_rect(reference_grill,Rect2i(0,0,96,40),GRILL_ORIGIN)
	for i in range(3):
		rebuilt.blend_rect(small_tray,Rect2i(0,0,16,12),TRAY_ORIGINS[i])
		rebuilt.blend_rect(foods[i],Rect2i(0,0,12,10),FOOD_ORIGINS[i])
	var grain = {}
	var opaque = 0
	var semi = 0
	var out_of_palette = 0
	var palette_colors = {}
	for swatch in swatches.colors: palette_colors[Color(str(swatch.hex)).to_html()] = true
	for y in range(SIZE.y):
		for x in range(SIZE.x):
			var color = complete.get_pixel(x,y)
			if color.a == 0: continue
			opaque += 1
			if color.a < 1: semi += 1
			grain[color.to_html()] = true
			if not palette_colors.has(color.to_html()): out_of_palette += 1
	var native_grill_preserved = true
	for i in range(7):
		native_grill_preserved = native_grill_preserved and pictures[i+4].get_region(Rect2i(GRILL_ORIGIN,Vector2i(96,40))).get_data() == grill_layers[i].get_data()
	if image is Image and bound_before is Image: image.copy_from(bound_before)
	var report = {"scene":scene_result.report,"tray":tray_result.report,"exactOriginalGrillPng":original_grill.get_data()==reference_grill.get_data(),"allSevenOriginalGrillLayersPreserved":native_grill_preserved,"independentNativeComponentsReconstructExactly":rebuilt.get_data()==complete.get_data(),"opaquePixels":opaque,"semitransparentPixels":semi,"outOfPalettePixels":out_of_palette,"visibleColors":grain.size(),"nativeSpriteScale":1,"previewScale":6,"sharedCounterGrillWorktopY":16,"sharedCounterGrillCabinetY":34,"sharedFloorContactRow":46,"activeProjectUnchanged":global.get("current_project")==active_before,"boundForeignImageUnchanged":not image is Image or image.get_data()==bound_before.get_data(),"exports":exports}
	write_json(output_dir.path_join("verification.json"),report)
	return report

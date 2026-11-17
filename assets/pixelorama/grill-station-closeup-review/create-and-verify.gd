# Execute through Pixelorama eval_gdscript. This creates private explicit Projects;
# it never selects, renames, closes or mutates an existing app project.
func blank(size):
	var output = Image.create(size.x,size.y,false,Image.FORMAT_RGBA8)
	output.fill(Color(0,0,0,0))
	return output

func composite(target, indices):
	var output = blank(target.size)
	for i in indices:
		output.blend_rect(target.frames[0].cels[i].get_image(),Rect2i(Vector2i.ZERO,target.size),Vector2i.ZERO)
	return output

func write_json(path, data):
	var file = FileAccess.open(path,FileAccess.WRITE)
	file.store_string(JSON.stringify(data,"  ")+"\n")
	file.close()

func private_project(name, size, names, pictures, prototype):
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
	target.palettes.clear()
	target.palettes["Grill station - approved rose cream chrome"] = prototype.palettes.values()[0].duplicate()
	target.animation_tags.append(prototype.animation_tags[0].get_script().new(name+"-static",Color("#ee75a3"),1,1))
	return target

func sprite_qa(picture):
	var colors = {}
	var opaque = 0
	var semi = 0
	var orphans = 0
	var width = picture.get_width()
	var height = picture.get_height()
	for y in range(height):
		for x in range(width):
			var color = picture.get_pixel(x,y)
			if color.a == 0: continue
			colors[color.to_html()] = true
			if color.a == 1: opaque += 1
			else: semi += 1
			var connected = false
			for dy in range(-1,2):
				for dx in range(-1,2):
					if dx == 0 and dy == 0: continue
					var nx = x+dx
					var ny = y+dy
					if nx >= 0 and ny >= 0 and nx < width and ny < height and picture.get_pixel(nx,ny).a > 0:
						connected = true
			if not connected: orphans += 1
	return {"opaquePixels":opaque,"semitransparentPixels":semi,"orphans":orphans,"visibleColors":colors.keys()}

func save_and_check(root, target, source_dir, output_dir, filename):
	var path = source_dir.path_join(filename+".pxo")
	if not root.get_node("OpenSave").call("save_pxo_file",path,false,target):
		return {"error":"Explicit native source save failed","source":path}
	var all_layers = range(target.layers.size())
	var merged = composite(target,all_layers)
	var png_path = output_dir.path_join(filename+".png")
	var export_code = merged.save_png(png_path)
	var zip = ZIPReader.new()
	if zip.open(path) != OK: return {"error":"Cannot read saved PXO ZIP"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened = blank(target.size)
	var populated = []
	var byte_sizes = []
	for i in range(target.layers.size()):
		var raw = zip.read_file("image_data/frames/1/layer_"+str(i+1))
		if raw.size() != target.size.x*target.size.y*4:
			zip.close()
			return {"error":"Saved cel RGBA size mismatch","layer":i,"bytes":raw.size()}
		var cel = Image.create_from_data(target.size.x,target.size.y,false,Image.FORMAT_RGBA8,raw)
		byte_sizes.append(raw.size())
		populated.append(cel.get_used_rect().has_area())
		reopened.blend_rect(cel,Rect2i(Vector2i.ZERO,target.size),Vector2i.ZERO)
	zip.close()
	var palette = JSON.parse_string(data.palettes[0].values()[0])
	var png = Image.load_from_file(png_path)
	var report = sprite_qa(merged)
	report.merge({"sourceSize":[data.size_x,data.size_y],"layerNames":data.layers.map(func(layer): return layer.name),"populatedLayers":populated,"celByteSizes":byte_sizes,"paletteSwatches":palette.colors.size(),"frames":data.frames.size(),"fps":data.fps,"frameDuration":data.frames[0].duration,"tag":data.tags[0].name,"sourcePixelsMatchNativePng":reopened.get_data()==png.get_data(),"pngExportCode":export_code})
	return report

func placed(size, source, point):
	var picture = blank(size)
	picture.blend_rect(source,Rect2i(Vector2i.ZERO,source.get_size()),point)
	return picture

func atlas_frame(name, x, y, size):
	return {"frame":{"x":x,"y":y,"w":size.x,"h":size.y},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":size.x,"h":size.y},"sourceSize":{"w":size.x,"h":size.y},"duration":1000}

func run(api, image, project, params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var bound_snapshot = image.duplicate() if image is Image else null
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	var food_dir = str(params.food_dir)
	var prototype = null
	for candidate in global.get("projects"):
		if candidate.name == "back-grill" and candidate.size == Vector2i(96,64) and candidate.layers.size() == 7 and candidate.palettes.size() > 0 and candidate.animation_tags.size() > 0:
			if JSON.parse_string(candidate.palettes.values()[0].serialize()).colors.size() == 14:
				prototype = candidate
				break
	if prototype == null:
		return {"error":"Open approved back-grill palette/tag prototype unavailable; no project or export changed"}
	var food_names = params.food_names
	var foods = []
	for name in food_names:
		var path = food_dir.path_join(str(name))
		if not FileAccess.file_exists(path): return {"error":"Ingredient export not ready","path":path}
		var food = Image.load_from_file(path)
		if food.get_size() != Vector2i(40,40): return {"error":"Ingredient must remain native40x40","path":path}
		foods.append(food)
	var generator = GDScript.new()
	generator.source_code = "extends RefCounted\n"+FileAccess.get_file_as_string(source_dir.path_join("draw.gd"))
	if generator.reload() != OK: return {"error":"Native drawing recipe does not compile"}
	var drawer = generator.new()
	var grill_pictures = []
	for role in range(6): grill_pictures.append(drawer.call("run",null,null,null,{"kind":"grill","role":role}))
	var grill = private_project("grill-topdown",Vector2i(288,192),["01 - shallow contact shadow","02 - horizontal stainless surround and deck","03 - broad bare cooking plate","04 - shallow grease channel","05 - four overhead control knobs","06 - hard reflections and rose badge"],grill_pictures,prototype)
	var tray_pictures = []
	for role in range(3): tray_pictures.append(drawer.call("run",null,null,null,{"kind":"tray","role":role}))
	var tray = private_project("ingredient-tray",Vector2i(64,56),["01 - shallow tray contact shadow","02 - steel surround and recessed floor","03 - edge reflections"],tray_pictures,prototype)
	var grill_png = composite(grill,range(6))
	var tray_png = composite(tray,range(3))
	var size = Vector2i(384,216)
	var backdrop = blank(size)
	backdrop.fill(Color("#f1e5d1"))
	var tray_mounts = [Vector2i(8,12),Vector2i(8,80),Vector2i(8,148)]
	var food_mounts = [Vector2i(20,20),Vector2i(20,88),Vector2i(20,156)]
	var tray_layer = blank(size)
	for mount in tray_mounts: tray_layer.blend_rect(tray_png,Rect2i(Vector2i.ZERO,tray_png.get_size()),mount)
	var preview_pictures = [backdrop,placed(size,grill_png,Vector2i(88,12)),tray_layer]
	for i in range(3): preview_pictures.append(placed(size,foods[i],food_mounts[i]))
	var preview = private_project("grill-station",size,["01 - optional warm neutral work surface","02 - bare top-down grill assembly","03 - three reusable empty steel trays","04 - independent raw patty preview","05 - independent plain sausage preview","06 - independent batter bowl and ladle preview"],preview_pictures,prototype)
	DirAccess.make_dir_recursive_absolute(source_dir)
	DirAccess.make_dir_recursive_absolute(output_dir)
	var reports = {}
	reports["grill"] = save_and_check(root,grill,source_dir,output_dir,"grill-topdown")
	reports["tray"] = save_and_check(root,tray,source_dir,output_dir,"ingredient-tray")
	reports["station"] = save_and_check(root,preview,source_dir,output_dir,"grill-station")
	var components = {"grill-topdown-steel.png":composite(grill,[0,1]),"grill-topdown-plate.png":composite(grill,[2]),"grill-topdown-hardware.png":composite(grill,[3,4,5]),"station-background.png":backdrop,"grill-station-transparent.png":composite(preview,[1,2,3,4,5])}
	var codes = {}
	for filename in components: codes[filename] = components[filename].save_png(output_dir.path_join(filename))
	var reconstructed = components["grill-topdown-steel.png"].duplicate()
	reconstructed.blend_rect(components["grill-topdown-plate.png"],Rect2i(Vector2i.ZERO,grill.size),Vector2i.ZERO)
	reconstructed.blend_rect(components["grill-topdown-hardware.png"],Rect2i(Vector2i.ZERO,grill.size),Vector2i.ZERO)
	reports["grillComponentsReconstructExactly"] = reconstructed.get_data() == grill_png.get_data()
	var preview_png = composite(preview,range(6))
	var rebuilt_station = backdrop.duplicate()
	rebuilt_station.blend_rect(components["grill-station-transparent.png"],Rect2i(Vector2i.ZERO,size),Vector2i.ZERO)
	reports["stationComponentsReconstructExactly"] = rebuilt_station.get_data() == preview_png.get_data()
	var enlarged = preview_png.duplicate()
	enlarged.resize(1152,648,Image.INTERPOLATE_NEAREST)
	codes["grill-station-preview.png"] = enlarged.save_png(source_dir.path_join("grill-station-preview.png"))
	var atlas_size = Vector2i(352,192)
	var atlas = blank(atlas_size)
	atlas.blend_rect(grill_png,Rect2i(Vector2i.ZERO,grill.size),Vector2i.ZERO)
	atlas.blend_rect(tray_png,Rect2i(Vector2i.ZERO,tray.size),Vector2i(288,0))
	codes["grill-station-parts-atlas.png"] = atlas.save_png(output_dir.path_join("grill-station-parts-atlas.png"))
	write_json(output_dir.path_join("grill-station-parts-atlas.json"),{"frames":{"grill-topdown":atlas_frame("grill",0,0,grill.size),"ingredient-tray":atlas_frame("tray",288,0,tray.size)},"meta":{"app":"Pixelorama MCP explicit native projects","image":"grill-station-parts-atlas.png","format":"RGBA8888","size":{"w":atlas_size.x,"h":atlas_size.y},"scale":"1","frameTags":[{"name":"grill-topdown-static","from":0,"to":0,"direction":"forward"},{"name":"ingredient-tray-static","from":1,"to":1,"direction":"forward"}]}})
	# Preserve the bound foreign cel as well as its selected project; no wrapper blit.
	if image is Image and bound_snapshot is Image: image.copy_from(bound_snapshot)
	reports["activeProjectUnchanged"] = global.get("current_project") == active_before
	reports["boundForeignImageUnchanged"] = not image is Image or image.get_data() == bound_snapshot.get_data()
	reports["componentExportCodes"] = codes
	write_json(output_dir.path_join("verification.json"),reports)
	return reports

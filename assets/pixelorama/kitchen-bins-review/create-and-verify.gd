const LAYERS = ["01 - mounting surround and rear lip", "02 - rolled removable bin rims", "03 - empty recessed bin planes", "04 - hard metal reflections"]

func blank(width,height):
	var output = Image.create(width,height,false,Image.FORMAT_RGBA8)
	output.fill(Color(0,0,0,0))
	return output

func composite(target, indices):
	var output = blank(target.size.x,target.size.y)
	for index in indices:
		output.blend_rect(target.frames[0].cels[index].get_image(),Rect2i(Vector2i.ZERO,target.size),Vector2i.ZERO)
	return output

func write_json(path, value):
	var file = FileAccess.open(path,FileAccess.WRITE)
	file.store_string(JSON.stringify(value,"  ")+"\n")
	file.close()

func qa(picture):
	var colors = {}
	var opaque = 0
	var semi = 0
	var orphan_count = 0
	var width = picture.get_width()
	var height = picture.get_height()
	for y in range(height):
		for x in range(width):
			var color = picture.get_pixel(x,y)
			if color.a == 0:
				continue
			colors[color.to_html()] = true
			if color.a == 1:
				opaque += 1
			else:
				semi += 1
			var neighbor = false
			for dy in range(-1,2):
				for dx in range(-1,2):
					var nx = x+dx
					var ny = y+dy
					if (dx!=0 or dy!=0) and nx>=0 and ny>=0 and nx<width and ny<height and picture.get_pixel(nx,ny).a>0:
						neighbor = true
			if not neighbor:
				orphan_count += 1
	var used = picture.get_used_rect()
	return {"opaquePixels":opaque,"semitransparentPixels":semi,"visibleColors":colors.size(),"orphans":orphan_count,"occupiedBounds":{"x":used.position.x,"y":used.position.y,"width":used.size.x,"height":used.size.y}}

func reopen_and_compare(path, expected, layer_count):
	var zip = ZIPReader.new()
	if zip.open(path)!=OK:
		return {"error":"Cannot reopen saved native source"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var width = int(data.size_x)
	var height = int(data.size_y)
	var restored = blank(width,height)
	var byte_sizes = []
	var populated = 0
	for index in range(1,layer_count+1):
		var raw = zip.read_file("image_data/frames/1/layer_"+str(index))
		byte_sizes.append(raw.size())
		if raw.size()!=width*height*4:
			zip.close()
			return {"error":"Saved cel byte dimensions differ"}
		var layer_image = Image.create_from_data(width,height,false,Image.FORMAT_RGBA8,raw)
		if layer_image.get_used_rect().size != Vector2i.ZERO:
			populated += 1
		restored.blend_rect(layer_image,Rect2i(0,0,width,height),Vector2i.ZERO)
	var palette_data = JSON.parse_string(data.palettes[0].values()[0])
	zip.close()
	return {"sourcePixelsMatchNativePng":restored.get_data()==expected.get_data(),"size":[width,height],"layers":data.layers.size(),"populatedLayers":populated,"frames":data.frames.size(),"paletteSwatches":palette_data.colors.size(),"tag":data.tags[0].name,"celByteSizes":byte_sizes}

func new_project(project_name,width,height,prototype,layer_names,images,tag_name):
	var target = load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),project_name,Vector2i(width,height))
	var frame = load("res://src/Classes/Frame.gd").new()
	for index in range(layer_names.size()):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target,layer_names[index])
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(images[index]))
	target.frames.append(frame)
	target.current_frame = 0
	target.current_layer = 0
	target.fps = 1
	target.frames[0].duration = 1.0
	target.palettes.clear()
	target.palettes["Kitchen bins - approved rose cream chrome"] = prototype.palettes.values()[0].duplicate()
	target.animation_tags.append(prototype.animation_tags[0].get_script().new(tag_name,Color("#ee75a3"),1,1))
	return target

func run(api, image, project, params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var prototype = null
	for candidate in global.get("projects"):
		if candidate.name=="back-grill" and candidate.size==Vector2i(96,64) and candidate.layers.size()==7 and candidate.palettes.size()>0 and candidate.animation_tags.size()>0:
			if JSON.parse_string(candidate.palettes.values()[0].serialize()).colors.size()==14:
				prototype = candidate
				break
	if prototype == null:
		return {"error":"Approved native grill palette/tag prototype unavailable; no artifact created"}
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	var geometry = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("geometry.json")))
	var generator = GDScript.new()
	generator.source_code = "extends RefCounted\n"+FileAccess.get_file_as_string(source_dir.path_join("draw.gd"))
	if generator.reload()!=OK:
		return {"error":"Drawing recipe failed compilation; no artifact created"}
	var drawer = generator.new()
	var top = Image.load_from_file(str(params.top_module))
	var fascia = Image.load_from_file(str(params.fascia_module))
	if top==null or top.get_size()!=Vector2i(16,24) or fascia==null or fascia.get_size()!=Vector2i(16,16):
		return {"error":"Accepted counter module dimensions differ"}
	var results = []
	var common_bin = null
	var all_bin_pixels_equal = true
	var preview_cabinet = blank(144,56)
	var preview_layers = []
	var preview_layer_names = ["01 - accepted counter modules reference"]
	for variant_index in range(geometry.variants.size()):
		var config = geometry.variants[variant_index]
		var width = int(config.frame.width)
		var height = int(config.frame.height)
		var images = []
		for role in range(LAYERS.size()):
			var rendered = drawer.call("run",null,null,null,{"role":role,"variant":config})
			if not rendered is Image or rendered.get_size()!=Vector2i(width,height):
				return {"error":"Native generated cel dimensions differ"}
			images.append(rendered)
		var target = new_project(str(config.projectName),width,height,prototype,LAYERS,images,str(config.id)+"-static")
		var complete = composite(target,[0,1,2,3])
		var mounting = composite(target,[0])
		var bins = composite(target,[1,2,3])
		var source_path = source_dir.path_join(str(config.id)+".pxo")
		var saved = root.get_node("OpenSave").call("save_pxo_file",source_path,false,target)
		if not saved:
			return {"error":"Explicit native source save failed"}
		var codes = {}
		codes["native"] = complete.save_png(output_dir.path_join(str(config.id)+".png"))
		codes["mount"] = mounting.save_png(output_dir.path_join(str(config.id)+"-mount.png"))
		codes["bins"] = bins.save_png(output_dir.path_join(str(config.id)+"-bins.png"))
		codes["atlas"] = complete.save_png(output_dir.path_join(str(config.id)+"-atlas.png"))
		var enlarged = complete.duplicate()
		enlarged.resize(width*6,height*6,Image.INTERPOLATE_NEAREST)
		codes["preview"] = enlarged.save_png(source_dir.path_join(str(config.id)+"-preview.png"))
		var rebuilt = mounting.duplicate()
		rebuilt.blend_rect(bins,Rect2i(0,0,width,height),Vector2i.ZERO)
		var profile_matches = true
		var mount = config.mount
		for row in range(24):
			if complete.get_pixel(int(mount.x),int(mount.y)+row)!=top.get_pixel(0,row) or complete.get_pixel(int(mount.x+mount.width)-1,int(mount.y)+row)!=top.get_pixel(15,row):
				profile_matches = false
		for bin_rect in config.bins:
			var cut = bins.get_region(Rect2i(int(bin_rect.x),int(bin_rect.y),12,14))
			if common_bin == null:
				common_bin = cut
			elif cut.get_data()!=common_bin.get_data():
				all_bin_pixels_equal = false
		var result = qa(complete)
		result["id"] = config.id
		result["saved"] = saved
		result["savedSource"] = reopen_and_compare(source_path,complete,4)
		result["componentsReconstructExactly"] = rebuilt.get_data()==complete.get_data()
		result["leftRightMountProfilesMatchCounter"] = profile_matches
		result["exportCodes"] = codes
		results.append(result)
		var atlas = {"frames":{str(config.id)+"_0":{"frame":{"x":0,"y":0,"w":width,"h":height},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":width,"h":height},"sourceSize":{"w":width,"h":height},"duration":1000}},"meta":{"app":"Pixelorama MCP native project export","format":"RGBA8888","image":str(config.id)+"-atlas.png","scale":"1","size":{"w":width,"h":height},"frameTags":[{"name":str(config.id)+"-static","from":0,"to":0,"direction":"forward","color":"ee75a3ff"}]}}
		write_json(output_dir.path_join(str(config.id)+"-atlas.json"),atlas)
		var preview_x = int(geometry.preview.placements[variant_index].x)
		var mounted = blank(144,56)
		mounted.blit_rect(complete,Rect2i(0,0,width,height),Vector2i(preview_x,0))
		preview_layers.append(mounted)
		preview_layer_names.append("0"+str(variant_index+2)+" - "+str(config.id)+" at native scale")
		for module_index in range(int(int(mount.width)/16)):
			var px = preview_x+int(mount.x)+module_index*16
			preview_cabinet.blit_rect(top,Rect2i(0,0,16,24),Vector2i(px,int(mount.y)))
			preview_cabinet.blit_rect(fascia,Rect2i(0,0,16,16),Vector2i(px,int(mount.y)+24))
	var bin_export_code = common_bin.save_png(output_dir.path_join("steel-empty-bin.png"))
	preview_layers.push_front(preview_cabinet)
	var preview_target = new_project("kitchen-bins-preview",144,56,prototype,preview_layer_names,preview_layers,"kitchen-bins-preview-static")
	var preview_complete = composite(preview_target,[0,1,2])
	var preview_saved = root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("kitchen-bins-preview.pxo"),false,preview_target)
	var preview_code = preview_complete.save_png(output_dir.path_join("bins-counter-preview.png"))
	var review_image = preview_complete.duplicate()
	review_image.resize(864,336,Image.INTERPOLATE_NEAREST)
	var review_code = review_image.save_png(source_dir.path_join("kitchen-bins-preview.png"))
	var final_report = {"variants":results,"allSevenBinsPixelIdentical":all_bin_pixels_equal,"binFrame":[12,14],"binExportCode":bin_export_code,"previewSaved":preview_saved,"previewSource":reopen_and_compare(source_dir.path_join("kitchen-bins-preview.pxo"),preview_complete,3),"previewExportCode":preview_code,"enlargedPreviewCode":review_code,"activeProjectUnchanged":global.get("current_project")==active_before}
	write_json(output_dir.path_join("verification.json"),final_report)
	return final_report

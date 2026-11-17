const NAMES = ["01 - mounting surround and rear lip","02 - rolled removable bin rims","03 - empty recessed bin planes","04 - hard chrome reflections"]

func blank(w,h):
	var output = Image.create(w,h,false,Image.FORMAT_RGBA8)
	output.fill(Color(0,0,0,0))
	return output

func box(picture,x,y,w,h,color):
	picture.fill_rect(Rect2i(x,y,w,h),Color(color))

func blend(pictures,w,h):
	var output = blank(w,h)
	for picture in pictures:
		output.blend_rect(picture,Rect2i(0,0,w,h),Vector2i.ZERO)
	return output

func write_json(path,value):
	var file = FileAccess.open(path,FileAccess.WRITE)
	file.store_string(JSON.stringify(value,"  ")+"\n")
	file.close()

func qa(picture):
	var opaque = 0
	var semi = 0
	var orphan = 0
	var colors = {}
	for yy in range(picture.get_height()):
		for xx in range(picture.get_width()):
			var color = picture.get_pixel(xx,yy)
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
					var nx = xx+dx
					var ny = yy+dy
					if (dx!=0 or dy!=0) and nx>=0 and ny>=0 and nx<picture.get_width() and ny<picture.get_height() and picture.get_pixel(nx,ny).a>0:
						neighbor = true
			if not neighbor:
				orphan += 1
	return {"opaquePixels":opaque,"semitransparentPixels":semi,"orphans":orphan,"visibleColors":colors.size()}

func run(api,image,project,params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var source = str(params.source_dir)
	var output = str(params.output_dir)
	var top = Image.load_from_file(str(params.top_module))
	if top == null or top.get_size() != Vector2i(16,18):
		return {"error":"Accepted compact16x18 countertop required"}
	var tag_script = null
	for candidate in global.get("projects"):
		if candidate.animation_tags.size()>0:
			tag_script = candidate.animation_tags[0].get_script()
			break
	if tag_script == null:
		return {"error":"Native static-tag prototype unavailable"}
	var swatches = JSON.parse_string(FileAccess.get_file_as_string(source.path_join("palette.json")))
	var reports = {}
	var standard_bin = null
	var definitions = [{"id":"rear-toppings-rail","w":48,"mountW":40,"positions":[8,20,32],"rearLip":true},{"id":"prep-bins-insert","w":56,"mountW":48,"positions":[7,18,29,40],"rearLip":false}]
	for definition in definitions:
		var w = int(definition.w)
		var h = 32
		var pictures = [blank(w,h),blank(w,h),blank(w,h),blank(w,h)]
		for yy in range(18):
			pictures[0].fill_rect(Rect2i(4,10+yy,int(definition.mountW),1),top.get_pixel(0,yy))
		if definition.rearLip:
			box(pictures[0],5,7,int(definition.mountW)-2,3,"#322c38")
			box(pictures[0],6,8,int(definition.mountW)-4,1,"#d5dfd3")
		for xx in definition.positions:
			box(pictures[1],xx,14,8,10,"#322c38")
			box(pictures[1],xx+1,15,6,8,"#676c70")
			box(pictures[1],xx+1,15,6,1,"#d5dfd3")
			box(pictures[1],xx+1,22,6,1,"#9ba8a5")
			box(pictures[2],xx+2,16,4,6,"#46404b")
			box(pictures[2],xx+2,16,4,1,"#322c38")
			box(pictures[2],xx+2,17,1,5,"#322c38")
			box(pictures[3],xx+1,16,1,6,"#d5dfd3")
			box(pictures[3],xx+2,22,3,1,"#d5dfd3")
		var complete = blend(pictures,w,h)
		var bins = blend(pictures.slice(1),w,h)
		var bin_mismatches = 0
		for xx in definition.positions:
			var crop = bins.get_region(Rect2i(int(xx),14,8,10))
			if standard_bin == null:
				standard_bin = crop
			if crop.get_data()!=standard_bin.get_data():
				bin_mismatches += 1
		var profile_mismatches = 0
		for yy in range(18):
			if complete.get_pixel(4,10+yy) != top.get_pixel(0,yy) or complete.get_pixel(3+int(definition.mountW),10+yy) != top.get_pixel(0,yy):
				profile_mismatches += 1
		var target = load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),str(definition.id)+"-v3",Vector2i(w,h))
		var frame = load("res://src/Classes/Frame.gd").new()
		for index in range(4):
			var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target,NAMES[index])
			target.layers.append(layer)
			frame.cels.append(layer.new_cel_from_image(pictures[index]))
		target.frames.append(frame)
		target.fps = 1
		target.current_frame = 0
		target.current_layer = 0
		frame.duration = 1.0
		var palette = load("res://src/Palette/Palette.gd").new("Kitchen bins compact",7,2,"Original approved14 kitchen colors")
		palette.is_project_palette = true
		for swatch in swatches.colors:
			palette.add_color(Color(str(swatch.hex)))
		target.palettes.clear()
		target.palettes["Kitchen bins compact"] = palette
		target.project_current_palette_name = "Kitchen bins compact"
		target.animation_tags.append(tag_script.new(str(definition.id)+"-v3-static",Color("#ee75a3"),1,1))
		var filename = source.path_join(str(definition.id)+".pxo")
		if not root.get_node("OpenSave").call("save_pxo_file",filename,false,target):
			return {"error":"Explicit native save failed","id":definition.id}
		complete.save_png(output.path_join(str(definition.id)+".png"))
		pictures[0].save_png(output.path_join(str(definition.id)+"-mount.png"))
		bins.save_png(output.path_join(str(definition.id)+"-bins.png"))
		var enlarged = complete.duplicate()
		enlarged.resize(w*6,h*6,Image.INTERPOLATE_NEAREST)
		enlarged.save_png(source.path_join(str(definition.id)+"-preview.png"))
		var zip = ZIPReader.new()
		if zip.open(filename)!=OK:
			return {"error":"Cannot reopen saved source"}
		var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
		var restored = blank(w,h)
		var sizes = []
		var populated = 0
		for index in range(4):
			var bytes = zip.read_file("image_data/frames/1/layer_"+str(index+1))
			if bytes.size()!=w*h*4:
				return {"error":"Saved cel byte size mismatch"}
			sizes.append(bytes.size())
			var restored_layer = Image.create_from_data(w,h,false,Image.FORMAT_RGBA8,bytes)
			if restored_layer.get_used_rect().has_area():
				populated += 1
			restored.blend_rect(restored_layer,Rect2i(0,0,w,h),Vector2i.ZERO)
		var saved_palette = JSON.parse_string(data.palettes[0].values()[0])
		zip.close()
		var components = pictures[0].duplicate()
		components.blend_rect(bins,Rect2i(0,0,w,h),Vector2i.ZERO)
		var report = qa(complete)
		report["sourcePixelsMatchNativePng"] = restored.get_data()==Image.load_from_file(output.path_join(str(definition.id)+".png")).get_data()
		report["componentsReconstructExactly"] = components.get_data()==complete.get_data()
		report["identicalBinMismatches"] = bin_mismatches
		report["mountProfileMismatches"] = profile_mismatches
		report["sourceSize"] = [data.size_x,data.size_y]
		report["sourceLayers"] = data.layers.size()
		report["populatedLayers"] = populated
		report["paletteSwatches"] = saved_palette.colors.size()
		report["celByteSizes"] = sizes
		report["frames"] = data.frames.size()
		report["fps"] = data.fps
		report["tag"] = data.tags[0].name
		reports[definition.id] = report
	standard_bin.save_png(output.path_join("steel-empty-bin.png"))
	reports["activeProjectUnchanged"] = global.get("current_project")==active_before
	write_json(output.path_join("verification.json"),reports)
	return reports

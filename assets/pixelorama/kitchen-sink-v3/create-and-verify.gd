const W = 48
const H = 32
const LAYERS = ["01 - steel mounting surround","02 - recessed basin walls and floor","03 - draining board ribs","04 - curved faucet and controls","05 - hard reflections and drain"]

func blank():
	var pic = Image.create(W,H,false,Image.FORMAT_RGBA8)
	pic.fill(Color(0,0,0,0))
	return pic

func blend(pictures,indices):
	var pic = blank()
	for index in indices:
		pic.blend_rect(pictures[index],Rect2i(0,0,W,H),Vector2i.ZERO)
	return pic

func run(api,image,project,params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	var tag_script = null
	for candidate in global.get("projects"):
		if candidate.animation_tags.size()>0:
			tag_script = candidate.animation_tags[0].get_script()
			break
	if tag_script == null:
		return {"error":"No native static-tag prototype"}
	var generator = GDScript.new()
	generator.source_code = "extends RefCounted\n"+FileAccess.get_file_as_string(source_dir.path_join("draw.gd"))
	if generator.reload()!=OK:
		return {"error":"Draw recipe failed compilation"}
	var drawer = generator.new()
	var pictures = []
	var target = load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"kitchen-sink-v3",Vector2i(W,H))
	var frame = load("res://src/Classes/Frame.gd").new()
	for role in range(LAYERS.size()):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target,LAYERS[role])
		var pic = drawer.call("run",null,null,target,{"role":role})
		pictures.append(pic)
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pic))
	target.frames.append(frame)
	target.current_layer = 0
	target.current_frame = 0
	target.fps = 1
	frame.duration = 1.0
	var swatches = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var palette = load("res://src/Palette/Palette.gd").new("Kitchen sink compact - approved kitchen colors",7,2,"Original fourteen kitchen swatches")
	palette.is_project_palette = true
	for swatch in swatches.colors:
		palette.add_color(Color(str(swatch.hex)))
	target.palettes.clear()
	target.palettes["Kitchen sink compact - approved kitchen colors"] = palette
	target.project_current_palette_name = "Kitchen sink compact - approved kitchen colors"
	target.animation_tags.append(tag_script.new("kitchen-sink-v3-static",Color("#ee75a3"),1,1))
	var complete = blend(pictures,[0,1,2,3,4])
	var surface = blend(pictures,[0,1,2,4])
	var faucet = pictures[3]
	var reconstructed = surface.duplicate()
	reconstructed.blend_rect(faucet,Rect2i(0,0,W,H),Vector2i.ZERO)
	if reconstructed.get_data()!=complete.get_data():
		return {"error":"Surface/faucet order differs from source"}
	var saved = root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("kitchen-sink.pxo"),false,target)
	if not saved:
		return {"error":"Private native save failed"}
	complete.save_png(output_dir.path_join("kitchen-sink.png"))
	complete.save_png(output_dir.path_join("kitchen-sink-atlas.png"))
	surface.save_png(output_dir.path_join("kitchen-sink-surface.png"))
	faucet.save_png(output_dir.path_join("kitchen-sink-faucet.png"))
	var preview = complete.duplicate()
	preview.resize(W*6,H*6,Image.INTERPOLATE_NEAREST)
	preview.save_png(source_dir.path_join("sink-preview.png"))
	preview.save_png(output_dir.path_join("sink-preview.png"))
	var zip = ZIPReader.new()
	if zip.open(source_dir.path_join("kitchen-sink.pxo"))!=OK:
		return {"error":"Cannot reopen actual saved native ZIP"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened = blank()
	var cel_sizes = []
	for index in range(LAYERS.size()):
		var raw = zip.read_file("image_data/frames/1/layer_"+str(index+1))
		cel_sizes.append(raw.size())
		if raw.size()!=W*H*4:
			return {"error":"Saved cel dimensions incorrect","index":index}
		var pic = Image.create_from_data(W,H,false,Image.FORMAT_RGBA8,raw)
		reopened.blend_rect(pic,Rect2i(0,0,W,H),Vector2i.ZERO)
	zip.close()
	var mismatches = 0
	var profile = ["#322c38","#d5dfd3"]
	for yy in range(2,15):
		profile.append("#9ba8a5")
	profile.append_array(["#d5dfd3","#676c70","#322c38"])
	for yy in range(18):
		for xx in [4,43]:
			if complete.get_pixel(xx,10+yy)!=Color(profile[yy]):
				mismatches += 1
	var colors = {}
	var opaque = 0
	var semi = 0
	var orphan = 0
	for yy in range(H):
		for xx in range(W):
			var color = complete.get_pixel(xx,yy)
			if color.a>0:
				colors[color.to_html()] = true
				opaque += 1
				if color.a<1:
					semi += 1
				var neighbor = false
				for offset in [Vector2i.LEFT,Vector2i.RIGHT,Vector2i.UP,Vector2i.DOWN]:
					var point = Vector2i(xx,yy)+offset
					if Rect2i(0,0,W,H).has_point(point) and complete.get_pixel(point.x,point.y).a>0:
						neighbor = true
				if not neighbor:
					orphan += 1
	var report = {"sourceSize":[W,H],"sourceLayers":data.layers.size(),"celByteSizes":cel_sizes,"frames":data.frames.size(),"fps":data.fps,"tag":data.tags[0].name,"paletteSwatches":JSON.parse_string(data.palettes[0].values()[0]).colors.size(),"savedSourceMatchesNativePng":reopened.get_data()==Image.load_from_file(output_dir.path_join("kitchen-sink.png")).get_data(),"privateCompositeMatchesSavedSource":reopened.get_data()==complete.get_data(),"componentsReconstructExactly":reconstructed.get_data()==complete.get_data(),"mountProfileMismatches":mismatches,"opaquePixels":opaque,"semitransparentPixels":semi,"orphans":orphan,"visibleColors":colors.size(),"activeProjectUnchanged":global.get("current_project")==active_before}
	var file = FileAccess.open(output_dir.path_join("verification.json"),FileAccess.WRITE)
	file.store_string(JSON.stringify(report,"  ")+"\n")
	file.close()
	return report

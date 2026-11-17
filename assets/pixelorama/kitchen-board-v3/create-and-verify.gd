const W = 28
const H = 18
const NAMES = ["01 - countertop contact shadow","02 - dark board edge and thickness","03 - warm amber board face","04 - rim highlights and quiet grain"]

func blank():
	var pic = Image.create(W,H,false,Image.FORMAT_RGBA8)
	pic.fill(Color(0,0,0,0))
	return pic

func box(pic,x,y,w,h,color):
	pic.fill_rect(Rect2i(x,y,w,h),Color(color))

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
	var pics = [blank(),blank(),blank(),blank()]
	box(pics[0],5,5,20,12,"#46404b")
	box(pics[0],5,16,1,1,"#00000000")
	box(pics[0],24,16,1,1,"#00000000")
	box(pics[1],4,3,20,12,"#322c38")
	box(pics[1],5,13,18,1,"#46404b")
	box(pics[2],5,4,18,8,"#e2ad68")
	box(pics[3],6,4,16,1,"#fff0d5")
	box(pics[3],5,5,1,6,"#f1e5d1")
	box(pics[3],7,10,4,1,"#f1e5d1")
	box(pics[3],17,7,3,1,"#f1e5d1")
	box(pics[3],6,12,16,1,"#f1e5d1")
	for pic in pics:
		box(pic,4,6,2,3,"#00000000")
	var target = load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"kitchen-board-v3",Vector2i(W,H))
	var frame = load("res://src/Classes/Frame.gd").new()
	var complete = blank()
	var body = blank()
	for role in range(4):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target,NAMES[role])
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pics[role]))
		complete.blend_rect(pics[role],Rect2i(0,0,W,H),Vector2i.ZERO)
		if role>0:
			body.blend_rect(pics[role],Rect2i(0,0,W,H),Vector2i.ZERO)
	target.frames.append(frame)
	target.current_frame = 0
	target.current_layer = 0
	target.fps = 1
	frame.duration = 1.0
	var swatches = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var palette = load("res://src/Palette/Palette.gd").new("Compact cutting board original diner palette",7,3,"Existing twenty-one diner swatches")
	palette.is_project_palette = true
	for swatch in swatches.colors:
		palette.add_color(Color(str(swatch.hex)))
	target.palettes.clear()
	target.palettes["Compact cutting board original diner palette"] = palette
	target.project_current_palette_name = "Compact cutting board original diner palette"
	target.animation_tags.append(tag_script.new("kitchen-board-v3-static",Color("#ee75a3"),1,1))
	var saved = root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("kitchen-board.pxo"),false,target)
	if not saved:
		return {"error":"Native explicit target save failed"}
	for entry in [["kitchen-board.png",complete],["kitchen-board-atlas.png",complete],["board-body.png",body],["board-shadow.png",pics[0]]]:
		if entry[1].save_png(output_dir.path_join(entry[0])) != OK:
			return {"error":"PNG export failed", "file":entry[0]}
	var preview = complete.duplicate()
	preview.resize(W*6,H*6,Image.INTERPOLATE_NEAREST)
	preview.save_png(source_dir.path_join("board-preview.png"))
	preview.save_png(output_dir.path_join("board-preview.png"))
	var zip = ZIPReader.new()
	if zip.open(source_dir.path_join("kitchen-board.pxo")) != OK:
		return {"error":"Saved source ZIP reopen failed"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var rebuilt = blank()
	var byte_sizes = []
	var populated = 0
	for role in range(4):
		var raw = zip.read_file("image_data/frames/1/layer_"+str(role+1))
		byte_sizes.append(raw.size())
		if raw.size() != W*H*4:
			return {"error":"Saved cel dimensions differ", "layer":role}
		var cel = Image.create_from_data(W,H,false,Image.FORMAT_RGBA8,raw)
		if cel.get_used_rect().has_area():
			populated += 1
		rebuilt.blend_rect(cel,Rect2i(0,0,W,H),Vector2i.ZERO)
	zip.close()
	var reconstructed = pics[0].duplicate()
	reconstructed.blend_rect(body,Rect2i(0,0,W,H),Vector2i.ZERO)
	var opaque = 0
	var semi = 0
	var orphans = 0
	var colors = {}
	for yy in range(H):
		for xx in range(W):
			var color = complete.get_pixel(xx,yy)
			if color.a==0:
				continue
			colors[color.to_html()] = true
			opaque += int(color.a==1)
			semi += int(color.a<1)
			var adjacent = false
			for delta in [Vector2i.LEFT,Vector2i.RIGHT,Vector2i.UP,Vector2i.DOWN]:
				var point = Vector2i(xx,yy)+delta
				if Rect2i(0,0,W,H).has_point(point) and complete.get_pixelv(point).a>0:
					adjacent = true
			if not adjacent:
				orphans += 1
	var saved_palette = JSON.parse_string(data.palettes[0].values()[0])
	var result = {"saved":saved,"sourceSize":[data.size_x,data.size_y],"sourceLayers":data.layers.size(),"populatedLayers":populated,"celByteSizes":byte_sizes,"paletteSwatches":saved_palette.colors.size(),"frames":data.frames.size(),"fps":data.fps,"frameDuration":data.frames[0].duration,"tag":data.tags[0].name,"sourcePixelsMatchNativePng":rebuilt.get_data()==Image.load_from_file(output_dir.path_join("kitchen-board.png")).get_data(),"componentsReconstructExactly":reconstructed.get_data()==complete.get_data(),"opaquePixels":opaque,"semitransparentPixels":semi,"visibleColors":colors.size(),"orphans":orphans,"activeProjectUnchanged":global.get("current_project")==active_before}
	var report = FileAccess.open(output_dir.path_join("verification.json"),FileAccess.WRITE)
	report.store_string(JSON.stringify(result,"  ")+"\n")
	report.close()
	return result

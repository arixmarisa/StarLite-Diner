const W = 56
const H = 56

func run(api, image, project, params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var prototype = null
	for candidate in global.get("projects"):
		if candidate.name == "back-grill" and candidate.size == Vector2i(96,64) and candidate.layers.size() == 7 and candidate.palettes.size() > 0 and candidate.animation_tags.size() > 0:
			if JSON.parse_string(candidate.palettes.values()[0].serialize()).colors.size() == 14:
				prototype = candidate
				break
	if prototype == null:
		return {"error":"Approved grill palette/tag prototype unavailable"}
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	var top = Image.load_from_file(str(params.top_module))
	var fascia = Image.load_from_file(str(params.fascia_module))
	var insert = Image.load_from_file(output_dir.path_join("kitchen-sink.png"))
	if top == null or top.get_size() != Vector2i(16,24) or fascia == null or fascia.get_size() != Vector2i(16,16) or insert == null or insert.get_size() != Vector2i(56,40):
		return {"error":"Counter modules or sink insert have unexpected native dimensions"}
	var cabinet = Image.create(W,H,false,Image.FORMAT_RGBA8)
	cabinet.fill(Color(0,0,0,0))
	for x in [4,20,36]:
		cabinet.blit_rect(top,Rect2i(0,0,16,24),Vector2i(x,12))
		cabinet.blit_rect(fascia,Rect2i(0,0,16,16),Vector2i(x,36))
	var mounted = Image.create(W,H,false,Image.FORMAT_RGBA8)
	mounted.fill(Color(0,0,0,0))
	mounted.blit_rect(insert,Rect2i(0,0,56,40),Vector2i.ZERO)
	var complete = cabinet.duplicate()
	complete.blend_rect(mounted,Rect2i(0,0,W,H),Vector2i.ZERO)
	var target = load("res://src/Classes/Project.gd").new(Array([], TYPE_OBJECT, "RefCounted", load("res://src/Classes/Frame.gd")), "kitchen-sink-preview", Vector2i(W,H))
	var frame = load("res://src/Classes/Frame.gd").new()
	for entry in [["01 - approved counter modules reference",cabinet],["02 - sink insert at native scale",mounted]]:
		var layer=load("res://src/Classes/Layers/PixelLayer.gd").new(target,entry[0])
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(entry[1]))
	target.frames.append(frame)
	target.current_frame=0
	target.current_layer=0
	target.fps=1
	target.frames[0].duration=1.0
	var palette_name="Kitchen sink comparison - approved palette"
	target.palettes.clear()
	target.palettes[palette_name]=prototype.palettes.values()[0].duplicate()
	target.animation_tags.append(prototype.animation_tags[0].get_script().new("kitchen-sink-preview-static",Color("#ee75a3"),1,1))
	var saved=root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("kitchen-sink-preview.pxo"),false,target)
	if not saved:
		return {"error":"Explicit native preview save failed"}
	var codes={}
	codes["nativePreview"]=complete.save_png(output_dir.path_join("sink-counter-preview.png"))
	var preview=complete.duplicate()
	preview.resize(W*6,H*6,Image.INTERPOLATE_NEAREST)
	codes["enlargedPreview"]=preview.save_png(source_dir.path_join("kitchen-sink-preview.png"))
	var surface=Image.load_from_file(output_dir.path_join("sink-surface.png"))
	var left_matches=true
	var right_matches=true
	for row in range(24):
		if surface.get_pixel(4,12+row)!=top.get_pixel(0,row):
			left_matches=false
		if surface.get_pixel(51,12+row)!=top.get_pixel(15,row):
			right_matches=false
	var zip=ZIPReader.new()
	if zip.open(source_dir.path_join("kitchen-sink-preview.pxo"))!=OK:
		return {"error":"Cannot reopen saved comparison source"}
	var data=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var rebuilt=Image.create(W,H,false,Image.FORMAT_RGBA8)
	rebuilt.fill(Color(0,0,0,0))
	for index in range(1,3):
		var raw=zip.read_file("image_data/frames/1/layer_"+str(index))
		if raw.size()!=W*H*4:
			return {"error":"Wrong comparison cel dimensions"}
		rebuilt.blend_rect(Image.create_from_data(W,H,false,Image.FORMAT_RGBA8,raw),Rect2i(0,0,W,H),Vector2i.ZERO)
	zip.close()
	var result={"saved":saved,"size":[data.size_x,data.size_y],"layers":data.layers.size(),"sourcePixelsMatchNativePreview":rebuilt.get_data()==complete.get_data(),"leftMountProfileMatchesCounter":left_matches,"rightMountProfileMatchesCounter":right_matches,"allPlacedAtNativeScale":true,"topModule":params.top_module,"fasciaModule":params.fascia_module,"activeProjectUnchanged":global.get("current_project")==active_before,"exportCodes":codes}
	var report=FileAccess.open(output_dir.path_join("mount-verification.json"),FileAccess.WRITE)
	report.store_string(JSON.stringify(result,"  ")+"\n")
	report.close()
	return result

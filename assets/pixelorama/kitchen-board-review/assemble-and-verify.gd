const W = 56
const H = 48

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var global=root.get_node("Global")
	var active_before=global.get("current_project")
	var source_dir=str(params.source_dir)
	var output_dir=str(params.output_dir)
	var top=Image.load_from_file(str(params.top_module))
	var fascia=Image.load_from_file(str(params.fascia_module))
	var board=Image.load_from_file(output_dir.path_join("kitchen-board.png"))
	if top==null or top.get_size()!=Vector2i(16,24) or fascia==null or fascia.get_size()!=Vector2i(16,16) or board==null or board.get_size()!=Vector2i(40,24):
		return {"error":"Counter or board native dimensions unexpected"}
	var prototype=null
	for candidate in global.get("projects"):
		if candidate.name=="back-grill" and candidate.size==Vector2i(96,64) and candidate.layers.size()==7 and candidate.animation_tags.size()>0:
			prototype=candidate
			break
	if prototype==null:
		return {"error":"Native tag prototype unavailable"}
	var cabinet=Image.create(W,H,false,Image.FORMAT_RGBA8)
	cabinet.fill(Color(0,0,0,0))
	for x in [4,20,36]:
		cabinet.blit_rect(top,Rect2i(0,0,16,24),Vector2i(x,4))
		cabinet.blit_rect(fascia,Rect2i(0,0,16,16),Vector2i(x,28))
	var mounted=Image.create(W,H,false,Image.FORMAT_RGBA8)
	mounted.fill(Color(0,0,0,0))
	mounted.blit_rect(board,Rect2i(0,0,40,24),Vector2i(8,3))
	var complete=cabinet.duplicate()
	complete.blend_rect(mounted,Rect2i(0,0,W,H),Vector2i.ZERO)
	var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"kitchen-board-preview",Vector2i(W,H))
	var frame=load("res://src/Classes/Frame.gd").new()
	for entry in [["01 - accepted kitchen counter modules",cabinet],["02 - cutting board at native scale",mounted]]:
		var layer=load("res://src/Classes/Layers/PixelLayer.gd").new(target,entry[0])
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(entry[1]))
	target.frames.append(frame)
	target.current_frame=0
	target.current_layer=0
	target.fps=1
	target.frames[0].duration=1.0
	var swatches=JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var palette_name="Kitchen board preview - existing front-of-house palette"
	var palette=load("res://src/Palette/Palette.gd").new(palette_name,7,3,"Existing front-of-house palette")
	palette.is_project_palette=true
	for swatch in swatches.colors:
		palette.add_color(Color(str(swatch.hex)))
	target.palettes.clear()
	target.palettes[palette_name]=palette
	target.animation_tags.append(prototype.animation_tags[0].get_script().new("kitchen-board-preview-static",Color("#e2ad68"),1,1))
	var saved=root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("kitchen-board-preview.pxo"),false,target)
	if not saved:
		return {"error":"Explicit counter mount preview save failed"}
	var codes={}
	codes["nativePreview"]=complete.save_png(output_dir.path_join("board-counter-preview.png"))
	var enlarged=complete.duplicate()
	enlarged.resize(W*6,H*6,Image.INTERPOLATE_NEAREST)
	codes["enlargedPreview"]=enlarged.save_png(source_dir.path_join("kitchen-board-preview.png"))
	var zip=ZIPReader.new()
	if zip.open(source_dir.path_join("kitchen-board-preview.pxo"))!=OK:
		return {"error":"Cannot reopen native board preview ZIP"}
	var data=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened=Image.create(W,H,false,Image.FORMAT_RGBA8)
	reopened.fill(Color(0,0,0,0))
	for index in range(1,3):
		var raw=zip.read_file("image_data/frames/1/layer_"+str(index))
		if raw.size()!=W*H*4:
			return {"error":"Preview cel dimension mismatch"}
		reopened.blend_rect(Image.create_from_data(W,H,false,Image.FORMAT_RGBA8,raw),Rect2i(0,0,W,H),Vector2i.ZERO)
	zip.close()
	var within_surface=true
	for y in range(H):
		for x in range(W):
			if mounted.get_pixel(x,y).a>0 and not Rect2i(4,4,48,24).has_point(Vector2i(x,y)):
				within_surface=false
	var result={"saved":saved,"size":[data.size_x,data.size_y],"layers":data.layers.size(),"sourcePixelsMatchNativePreview":reopened.get_data()==complete.get_data(),"entireBoardAndShadowWithinCountertop":within_surface,"allPlacedAtNativeScale":true,"activeProjectUnchanged":global.get("current_project")==active_before,"exportCodes":codes}
	var report=FileAccess.open(output_dir.path_join("mount-verification.json"),FileAccess.WRITE)
	report.store_string(JSON.stringify(result,"  ")+"\n")
	report.close()
	return result

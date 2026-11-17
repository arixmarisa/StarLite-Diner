const W = 8
const H = 10
const NAMES = ["01 - counter contact shadow","02 - cup silhouettes and handle","03 - warm cream cup stack","04 - rim glints and rose accent"]

func blank():
	var picture = Image.create(W,H,false,Image.FORMAT_RGBA8)
	picture.fill(Color(0,0,0,0))
	return picture

func box(picture,x,y,w,h,color):
	picture.fill_rect(Rect2i(x,y,w,h),Color(color))

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
		return {"error":"No native static tag prototype"}
	var pictures = [blank(),blank(),blank(),blank()]
	box(pictures[0],2,8,5,2,"#46404b")
	box(pictures[1],1,1,5,7,"#322c38")
	box(pictures[1],2,8,3,1,"#322c38")
	box(pictures[1],5,3,2,3,"#322c38")
	box(pictures[2],2,2,3,6,"#f1e5d1")
	box(pictures[2],5,4,1,1,"#f1e5d1")
	box(pictures[3],2,1,3,1,"#fff5df")
	box(pictures[3],2,2,1,5,"#fff5df")
	box(pictures[3],2,3,3,1,"#d5dfd3")
	box(pictures[3],2,5,3,1,"#d5dfd3")
	box(pictures[3],3,7,2,1,"#ee75a3")
	var target = load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"kitchen-cups-v3",Vector2i(W,H))
	var frame = load("res://src/Classes/Frame.gd").new()
	var complete = blank()
	for index in range(NAMES.size()):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target,NAMES[index])
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pictures[index]))
		complete.blend_rect(pictures[index],Rect2i(0,0,W,H),Vector2i.ZERO)
	target.frames.append(frame)
	target.fps = 1
	target.current_frame = 0
	target.current_layer = 0
	frame.duration = 1.0
	var swatches = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var palette = load("res://src/Palette/Palette.gd").new("Kitchen cups - approved diner palette",7,3,"Existing front-of-house colors")
	palette.is_project_palette = true
	for swatch in swatches.colors:
		palette.add_color(Color(str(swatch.hex)))
	target.palettes.clear()
	target.palettes["Kitchen cups - approved diner palette"] = palette
	target.project_current_palette_name = "Kitchen cups - approved diner palette"
	target.animation_tags.append(tag_script.new("kitchen-cups-v3-static",Color("#ee75a3"),1,1))
	if not root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("cup-stack.pxo"),false,target):
		return {"error":"Explicit native save failed"}
	complete.save_png(output_dir.path_join("cup-stack.png"))
	complete.save_png(output_dir.path_join("cup-stack-atlas.png"))
	var enlarged = complete.duplicate()
	enlarged.resize(W*6,H*6,Image.INTERPOLATE_NEAREST)
	enlarged.save_png(source_dir.path_join("cup-stack-preview.png"))
	var zip = ZIPReader.new()
	if zip.open(source_dir.path_join("cup-stack.pxo")) != OK:
		return {"error":"Cannot independently reopen saved native ZIP"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened = blank()
	var lengths = []
	for index in range(NAMES.size()):
		var raw = zip.read_file("image_data/frames/1/layer_"+str(index+1))
		lengths.append(raw.size())
		if raw.size()!=W*H*4:
			return {"error":"Wrong cel length"}
		reopened.blend_rect(Image.create_from_data(W,H,false,Image.FORMAT_RGBA8,raw),Rect2i(0,0,W,H),Vector2i.ZERO)
	zip.close()
	var saved_palette = JSON.parse_string(data.palettes[0].values()[0])
	var semi = 0
	var opaque = 0
	var orphans = 0
	for yy in range(H):
		for xx in range(W):
			var color = complete.get_pixel(xx,yy)
			if color.a>0:
				opaque+=1
				if color.a<1:
					semi+=1
				var neighbor = false
				for offset in [Vector2i.LEFT,Vector2i.RIGHT,Vector2i.UP,Vector2i.DOWN]:
					var next = Vector2i(xx,yy)+offset
					if Rect2i(0,0,W,H).has_point(next) and complete.get_pixel(next.x,next.y).a>0:
						neighbor = true
				if not neighbor:
					orphans+=1
	var result = {"sourceSize":[data.size_x,data.size_y],"sourceLayers":data.layers.size(),"frames":data.frames.size(),"fps":data.fps,"tag":data.tags[0].name,"paletteSwatches":saved_palette.colors.size(),"celByteSizes":lengths,"savedSourceMatchesPng":reopened.get_data()==Image.load_from_file(output_dir.path_join("cup-stack.png")).get_data(),"activeProjectUnchanged":global.get("current_project")==active_before,"opaquePixels":opaque,"semitransparentPixels":semi,"orphans":orphans}
	var report = FileAccess.open(output_dir.path_join("verification.json"),FileAccess.WRITE)
	report.store_string(JSON.stringify(result,"  ")+"\n")
	report.close()
	return result

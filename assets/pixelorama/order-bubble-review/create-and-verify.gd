func blank(width, height):
	var output = Image.create(width, height, false, Image.FORMAT_RGBA8)
	output.fill(Color(0,0,0,0))
	return output

func write_json(path, value):
	var file = FileAccess.open(path, FileAccess.WRITE)
	file.store_string(JSON.stringify(value, "  ") + "\n")
	file.close()

func composite(pictures, size):
	var output = blank(size.x, size.y)
	for picture in pictures:
		output.blend_rect(picture, Rect2i(Vector2i.ZERO,size), Vector2i.ZERO)
	return output

func colors_of(picture):
	var colors = []
	for y in range(picture.get_height()):
		for x in range(picture.get_width()):
			var color = picture.get_pixel(x,y)
			if color.a > 0 and not colors.has(color.to_html(false)):
				colors.append(color.to_html(false))
	return colors

func stats(picture):
	var semi = 0
	var opaque = 0
	var remaining = {}
	for y in range(picture.get_height()):
		for x in range(picture.get_width()):
			var ink = picture.get_pixel(x,y)
			if ink.a > 0:
				remaining[Vector2i(x,y)] = true
				if ink.a == 1: opaque += 1
				else: semi += 1
	var components = 0
	while not remaining.is_empty():
		components += 1
		var first = remaining.keys()[0]
		remaining.erase(first)
		var queue = [first]
		while not queue.is_empty():
			var current = queue.pop_back()
			for delta in [Vector2i.LEFT,Vector2i.RIGHT,Vector2i.UP,Vector2i.DOWN]:
				var point = current + delta
				if remaining.has(point):
					remaining.erase(point)
					queue.append(point)
	var bounds = picture.get_used_rect()
	return {"opaquePixels":opaque,"semitransparentPixels":semi,"visibleColors":colors_of(picture).size(),"connectedComponents":components,"occupiedBounds":{"x":bounds.position.x,"y":bounds.position.y,"width":bounds.size.x,"height":bounds.size.y}}

func render(spec):
	var pictures = []
	var size = Vector2i(int(spec.width), int(spec.height))
	for layer in spec.layers:
		var pixels = blank(size.x,size.y)
		for command in layer.rectangles:
			var rect = Rect2i(int(command.x),int(command.y),int(command.w),int(command.h))
			if not Rect2i(Vector2i.ZERO,size).encloses(rect) or not spec.palette.has(str(command.c)):
				return {"error":"Invalid rectangle or palette token", "command":command}
			pixels.fill_rect(rect,Color(str(spec.palette[str(command.c)])))
		pictures.append(pixels)
	return {"pictures":pictures,"composite":composite(pictures,size)}

func make_project(project_name, size, names, pictures, colors, tag):
	var target = load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),project_name,size)
	if target.frames.size()!=0 or target.layers.size()!=0: return null
	var frame = load("res://src/Classes/Frame.gd").new()
	frame.duration = 1.0
	for index in range(names.size()):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target,str(names[index]))
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pictures[index]))
	target.frames.append(frame)
	target.current_frame = 0
	target.current_layer = 0
	target.fps = 1
	var palette = load("res://src/Palette/Palette.gd").new(project_name+" palette",8,maxi(1,int(ceil(colors.size()/8.0))),"Cozy diner speech-bubble review")
	palette.is_project_palette = true
	for hex in colors: palette.add_color(Color(str(hex)))
	target.palettes[palette.name] = palette
	target.project_current_palette_name = palette.name
	target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new(tag,Color("#ee75a3"),1,1))
	return target

func verify_saved(path, size, names, pictures, expected):
	var zip = ZIPReader.new()
	if zip.open(path)!=OK: return {"error":"Cannot reopen source"}
	var metadata = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	if int(metadata.size_x)!=size.x or int(metadata.size_y)!=size.y or metadata.layers.size()!=names.size() or metadata.frames.size()!=1 or metadata.tags.size()!=1: return {"error":"Wrong saved source metadata"}
	var rebuilt = blank(size.x,size.y)
	for index in range(names.size()):
		if str(metadata.layers[index].name)!=str(names[index]): return {"error":"Wrong saved layer name"}
		var raw = zip.read_file("image_data/frames/1/layer_"+str(index+1))
		if raw!=pictures[index].get_data(): return {"error":"Saved cel bytes differ", "layer":index}
		var cel = Image.create_from_data(size.x,size.y,false,Image.FORMAT_RGBA8,raw)
		rebuilt.blend_rect(cel,Rect2i(Vector2i.ZERO,size),Vector2i.ZERO)
	zip.close()
	var palette = JSON.parse_string(metadata.palettes[0].values()[0])
	return {"savedCelsExact":pictures.size(),"sourceCompositeExact":rebuilt.get_data()==expected.get_data(),"size":[size.x,size.y],"layers":names.size(),"frames":metadata.frames.size(),"fps":metadata.fps,"tag":metadata.tags[0].name,"paletteSwatches":palette.colors.size()}

func preview(picture, path, factor):
	var large = picture.duplicate()
	large.resize(picture.get_width()*factor,picture.get_height()*factor,Image.INTERPOLATE_NEAREST)
	return large.save_png(path)

func atlas_metadata(image_name, size, tag):
	return {"frames":{"static_0":{"frame":{"x":0,"y":0,"w":size.x,"h":size.y},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":size.x,"h":size.y},"sourceSize":{"w":size.x,"h":size.y},"duration":1000}},"meta":{"app":"Pixelorama MCP","image":image_name,"format":"RGBA8888","scale":"1","size":{"w":size.x,"h":size.y},"frameTags":[{"name":tag,"from":0,"to":0,"direction":"forward","color":"ee75a3ff"}]}}

func run(api, image, project, params):
	var root = Engine.get_main_loop().root
	var active_before = root.get_node("Global").get("current_project")
	var source = str(params.source_dir)
	var output = str(params.output_dir)
	DirAccess.make_dir_recursive_absolute(source)
	DirAccess.make_dir_recursive_absolute(output)
	var reports = {}
	var images = {}
	var assets = []
	var all_colors = []
	for name in ["bubble","burger"]:
		var spec = JSON.parse_string(FileAccess.get_file_as_string(source.path_join(name+".json")))
		var rendered = render(spec)
		if rendered.has("error"): return rendered
		var size = Vector2i(int(spec.width),int(spec.height))
		var names = spec.layers.map(func(layer): return str(layer.name))
		var colors = spec.palette.values()
		for color in colors:
			if not all_colors.has(str(color)): all_colors.append(str(color))
		var target = make_project(str(spec.id),size,names,rendered.pictures,colors,str(spec.animation.tag))
		if target==null: return {"error":"Private project construction failed"}
		var pxo_path = source.path_join(name+".pxo")
		if not root.get_node("OpenSave").call("save_pxo_file",pxo_path,false,target): return {"error":"Native save failed"}
		var verification = verify_saved(pxo_path,size,names,rendered.pictures,rendered.composite)
		if verification.has("error") or not verification.sourceCompositeExact: return {"error":"Source verification failed", "detail":verification}
		var png_path = output.path_join(name+".png")
		if rendered.composite.save_png(png_path)!=OK: return {"error":"PNG export failed"}
		var reopened = Image.load_from_file(png_path)
		verification.pngRoundtripExact = reopened.get_data()==rendered.composite.get_data()
		verification.stats = stats(reopened)
		if verification.stats.semitransparentPixels!=0 or verification.stats.connectedComponents!=1 or not verification.pngRoundtripExact: return {"error":"Unexpected source alpha/connectivity", "detail":verification}
		if name=="bubble":
			var clear = true
			var content = spec.contentRect
			for y in range(int(content.y),int(content.y+content.height)):
				for x in range(int(content.x),int(content.x+content.width)):
					if reopened.get_pixel(x,y)!=Color(str(spec.palette.cream)): clear=false
			verification.contentUniformEmptyCream = clear
			verification.tailAnchorOpaque = reopened.get_pixel(int(spec.tailAnchor.x),int(spec.tailAnchor.y)).a==1
			if not clear or not verification.tailAnchorOpaque: return {"error":"Bubble content or tail invalid"}
		preview(reopened,source.path_join(name+"-preview.png"),12)
		preview(reopened,output.path_join(name+"-preview.png"),12)
		write_json(output.path_join(name+"-atlas.json"),atlas_metadata(name+".png",size,str(spec.animation.tag)))
		write_json(source.path_join(name+"-palette.json"),{"name":str(spec.id)+" palette","colors":spec.palette})
		write_json(output.path_join(name+"-palette.json"),{"name":str(spec.id)+" palette","colors":spec.palette})
		images[name]=reopened
		reports[name]=verification
		var asset = {"id":str(spec.id),"image":name+".png","source":"assets/pixelorama/order-bubble-review/"+name+".pxo","frameSize":{"width":size.x,"height":size.y},"renderRole":"world-overlay","collision":null,"interaction":null,"layers":names,"palette":name+"-palette.json","paletteSource":"assets/pixelorama/order-bubble-review/"+name+"-palette.json","animation":spec.animation,"transparentExterior":true}
		if name=="bubble":
			asset.contentRect=spec.contentRect
			asset.tailAnchor=spec.tailAnchor
			asset.iconPlacement=spec.iconPlacement
		assets.append(asset)
	var customer = Image.load_from_file(str(params.repo_dir).path_join("apps/web/public/art/customer-v1/female-tee-jeans-south-idle.png"))
	if customer.get_size()!=Vector2i(16,24): return {"error":"Wrong existing customer reference"}
	for color in colors_of(customer):
		var hex = "#"+str(color)
		if not all_colors.has(hex): all_colors.append(hex)
	var review_size = Vector2i(104,64)
	var placements = [
		{"name":"01 - empty bubble reference","asset":"bubble","x":4,"y":4},
		{"name":"02 - independent burger reference","asset":"burger","x":44,"y":10},
		{"name":"03 - filled example bubble","asset":"bubble","x":68,"y":4},
		{"name":"04 - example burger overlay","asset":"burger","x":76,"y":7},
		{"name":"05 - unchanged customer scale reference","asset":"customer","x":76,"y":36}
	]
	images.customer = customer
	var review_layers = []
	var review_names = []
	for placement in placements:
		var plane = blank(review_size.x,review_size.y)
		var picture = images[str(placement.asset)]
		plane.blit_rect(picture,Rect2i(Vector2i.ZERO,picture.get_size()),Vector2i(int(placement.x),int(placement.y)))
		review_layers.append(plane)
		review_names.append(str(placement.name))
	var review = composite(review_layers,review_size)
	var review_project = make_project("order-bubble-review",review_size,review_names,review_layers,all_colors,"order-bubble-review-static")
	if not root.get_node("OpenSave").call("save_pxo_file",source.path_join("review.pxo"),false,review_project): return {"error":"Review source save failed"}
	reports.review = verify_saved(source.path_join("review.pxo"),review_size,review_names,review_layers,review)
	if reports.review.has("error") or not reports.review.sourceCompositeExact: return {"error":"Review source verification failed"}
	review.save_png(output.path_join("review.png"))
	preview(review,source.path_join("review-preview.png"),6)
	preview(review,output.path_join("review-preview.png"),6)
	write_json(source.path_join("review.json"),{"size":{"width":104,"height":64},"previewScale":6,"placements":placements,"customerImage":"/art/customer-v1/female-tee-jeans-south-idle.png","purpose":"Review only; not an additional game asset or implemented order."})
	write_json(output.path_join("manifest.json"),{"schemaVersion":1,"status":"awaiting-visual-approval","authoringTool":"Pixelorama MCP","newGameAssets":2,"sourcePathBase":"repository-root","assets":assets,"review":{"image":"review.png","preview":"review-preview.png","source":"assets/pixelorama/order-bubble-review/review.pxo","size":{"width":104,"height":64},"previewScale":6,"placements":placements,"customerImage":"/art/customer-v1/female-tee-jeans-south-idle.png"},"integration":"Not integrated; no order, notepad, timer, interaction or other icon implementation.","nextWork":"Wait for user approval before additional bubble variants or food/topping icons."})
	reports.activeProjectUnchanged = root.get_node("Global").get("current_project")==active_before
	write_json(source.path_join("verification.json"),reports)
	return reports

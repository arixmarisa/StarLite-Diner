const W = 36
const H = 10
const LAYERS = ["01 - compact contact shadows", "02 - raw meat plum contours", "03 - raw meat pink and light clusters", "04 - oblique stainless bowl", "05 - cream pancake batter", "06 - connected steel ladle"]
const ITEMS = ["raw-patty", "raw-sausage", "pancake-batter"]

func composite(target):
	var picture = Image.create(W,H,false,Image.FORMAT_RGBA8)
	picture.fill(Color(0,0,0,0))
	for cel in target.frames[0].cels:
		picture.blend_rect(cel.get_image(),Rect2i(0,0,W,H),Vector2i.ZERO)
	return picture

func qa(pic):
	var opaque = 0
	var semi = 0
	var orphans = 0
	var colors = {}
	var allowed = {}
	for color in ["322c38ff","46404bff","676c70ff","9ba8a5ff","d5dfd3ff","fff0d5ff","9f385eff","c94d7bff","ee75a3ff","ffacc9ff","ffd2deff","a6bcb2ff","f1e5d1ff","fff5dfff"]:
		allowed[color] = true
	var invalid = 0
	for y in range(pic.get_height()):
		for x in range(pic.get_width()):
			var color = pic.get_pixel(x,y)
			if color.a == 0:
				continue
			colors[color.to_html()] = true
			if not allowed.has(color.to_html()):
				invalid += 1
			if color.a == 1:
				opaque += 1
			else:
				semi += 1
			var neighbors = 0
			for dy in [-1,0,1]:
				for dx in [-1,0,1]:
					if dx == 0 and dy == 0:
						continue
					var xx = x+dx
					var yy = y+dy
					if xx >= 0 and yy >= 0 and xx < pic.get_width() and yy < pic.get_height() and pic.get_pixel(xx,yy).a > 0:
						neighbors += 1
			if neighbors == 0:
				orphans += 1
	var bounds = pic.get_used_rect()
	return {"opaquePixels":opaque,"semitransparentPixels":semi,"orphanPixels":orphans,"visibleColors":colors.size(),"outOfPalettePixels":invalid,"contentBounds":{"x":bounds.position.x,"y":bounds.position.y,"width":bounds.size.x,"height":bounds.size.y}}

func run(api, image, project, params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active = global.get("current_project")
	var active_before = active.frames[active.current_frame].cels[active.current_layer].get_image().get_data()
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	var prototype = null
	for candidate in global.get("projects"):
		if candidate.name == "back-grill" and candidate.size == Vector2i(96,64) and candidate.layers.size() == 7 and candidate.palettes.size() == 1 and candidate.animation_tags.size() > 0:
			if JSON.parse_string(candidate.palettes.values()[0].serialize()).colors.size() == 14:
				prototype = candidate
				break
	if prototype == null:
		return {"error":"Approved native grill palette/tag prototype unavailable"}
	var recipe = GDScript.new()
	recipe.source_code = "extends RefCounted\n"+FileAccess.get_file_as_string(source_dir.path_join("draw.gd"))
	if recipe.reload() != OK:
		return {"error":"Drawing recipe failed compilation"}
	var drawer = recipe.new()
	var target = load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"grill-station-ingredients-v2",Vector2i(W,H))
	if target.frames.size() != 0 or target.layers.size() != 0:
		return {"error":"Expected private empty project"}
	var frame = load("res://src/Classes/Frame.gd").new()
	for index in range(LAYERS.size()):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target,LAYERS[index])
		var pixels = drawer.call("run",null,null,target,{"role":index})
		if not pixels is Image or pixels.get_size() != Vector2i(W,H):
			return {"error":"Invalid recipe image"}
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pixels))
	target.frames.append(frame)
	target.current_frame = 0
	target.current_layer = 0
	target.fps = 1
	frame.duration = 1.0
	target.palettes["Approved booth rose cream chrome"] = prototype.palettes.values()[0].duplicate()
	target.animation_tags.append(prototype.animation_tags[0].get_script().new("room-ingredients-static",Color("#ee75a3"),1,1))
	var picture = composite(target)
	var saved = root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("raw-ingredients.pxo"),false,target)
	if not saved:
		return {"error":"Explicit target native save failed"}
	var codes = {"atlas":picture.save_png(output_dir.path_join("raw-ingredients-atlas.png"))}
	var sprites = {}
	for i in range(ITEMS.size()):
		var sprite = picture.get_region(Rect2i(i*12,0,12,10))
		codes[ITEMS[i]] = sprite.save_png(output_dir.path_join(ITEMS[i]+".png"))
		sprites[ITEMS[i]] = qa(sprite)
		var loaded = Image.load_from_file(output_dir.path_join(ITEMS[i]+".png"))
		sprites[ITEMS[i]]["nativeCropPngEqual"] = loaded.get_data() == sprite.get_data()
	var preview = picture.duplicate()
	preview.resize(W*6,H*6,Image.INTERPOLATE_NEAREST)
	codes["preview"] = preview.save_png(source_dir.path_join("raw-ingredients-preview.png"))
	var zip = ZIPReader.new()
	if zip.open(source_dir.path_join("raw-ingredients.pxo")) != OK:
		return {"error":"Cannot inspect saved native ZIP"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened = Image.create(W,H,false,Image.FORMAT_RGBA8)
	reopened.fill(Color(0,0,0,0))
	var cels = []
	for i in range(LAYERS.size()):
		var raw = zip.read_file("image_data/frames/1/layer_"+str(i+1))
		if raw.size() != W*H*4:
			return {"error":"Wrong saved native cel length"}
		cels.append({"layer":LAYERS[i],"bytes":raw.size(),"savedCelMatches":raw == frame.cels[i].get_image().get_data()})
		reopened.blend_rect(Image.create_from_data(W,H,false,Image.FORMAT_RGBA8,raw),Rect2i(0,0,W,H),Vector2i.ZERO)
	zip.close()
	var loaded = Image.load_from_file(output_dir.path_join("raw-ingredients-atlas.png"))
	var palette = JSON.parse_string(data.palettes[0].values()[0])
	var result = {"saved":saved,"sourceSize":[data.size_x,data.size_y],"frames":data.frames.size(),"layers":data.layers.size(),"tag":data.tags[0].name,"fps":target.fps,"durationMultiplier":frame.duration,"paletteSwatches":palette.colors.size(),"cels":cels,"savedSourceMatchesAtlas":reopened.get_data() == loaded.get_data(),"activeProjectUnchanged":global.get("current_project") == active,"foreignActiveCelUnchanged":active_before == active.frames[active.current_frame].cels[active.current_layer].get_image().get_data(),"sprites":sprites,"atlas":qa(picture),"exportCodes":codes}
	var report = FileAccess.open(output_dir.path_join("verification.json"),FileAccess.WRITE)
	report.store_string(JSON.stringify(result,"  ")+"\n")
	report.close()
	return result

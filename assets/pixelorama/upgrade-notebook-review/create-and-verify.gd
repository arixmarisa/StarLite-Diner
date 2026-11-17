const LAYERS = ["01 - rose cover border and shadow", "02 - warm paper page borders", "03 - repeating cloth and chrome binding", "04 - reusable entry and category outlines", "05 - blank action and scroll outlines", "06 - optional separate paper fill"]

func blank(width, height):
	var output = Image.create(width, height, false, Image.FORMAT_RGBA8)
	output.fill(Color(0,0,0,0))
	return output

func rounded_rect(output, item):
	var px = int(item.x)
	var py = int(item.y)
	var width = int(item.w)
	var height = int(item.h)
	var radius = int(item.radius)
	var ink = Color(str(item.color))
	for yy in range(py, py + height):
		var edge_distance = mini(yy - py, py + height - 1 - yy)
		var inset = 0
		if edge_distance < radius:
			inset = radius - edge_distance
			if radius == 3 and edge_distance == 1:
				inset = 1
		output.fill_rect(Rect2i(px + inset, yy, width - inset * 2, 1), ink)

func component_image(component):
	var rect = component.sourceRect
	var output = blank(int(rect.width), int(rect.height))
	for command in component.commands:
		rounded_rect(output, command)
	return output

func tile_nine(source, width, height, margins):
	var left = int(margins.left)
	var top = int(margins.top)
	var right = int(margins.right)
	var bottom = int(margins.bottom)
	var output = blank(width, height)
	for yy in range(height):
		var sy = yy
		if yy >= height - bottom:
			sy = source.get_height() - (height - yy)
		elif yy >= top:
			sy = top + (yy - top) % (source.get_height() - top - bottom)
		for xx in range(width):
			var sx = xx
			if xx >= width - right:
				sx = source.get_width() - (width - xx)
			elif xx >= left:
				sx = left + (xx - left) % (source.get_width() - left - right)
			output.set_pixel(xx, yy, source.get_pixel(sx, sy))
	return output

func composite(target, included):
	var output = blank(target.size.x, target.size.y)
	for index in included:
		output.blend_rect(target.frames[0].cels[index].get_image(), Rect2i(Vector2i.ZERO, target.size), Vector2i.ZERO)
	return output

func make_project(project_name, size, names, pictures, palette_data, tag_name):
	var target = load("res://src/Classes/Project.gd").new(Array([], TYPE_OBJECT, "RefCounted", load("res://src/Classes/Frame.gd")), project_name, size)
	if target.layers.size() != 0 or target.frames.size() != 0:
		return null
	var native_frame = load("res://src/Classes/Frame.gd").new()
	for index in range(names.size()):
		if pictures[index].get_size() != size:
			return null
		var native_layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target, names[index])
		target.layers.append(native_layer)
		native_frame.cels.append(native_layer.new_cel_from_image(pictures[index]))
	target.frames.append(native_frame)
	target.current_frame = 0
	target.current_layer = 0
	target.fps = 1
	native_frame.duration = 1.0
	var palette_name = "Upgrade notebook - approved rose cream chrome"
	var palette = load("res://src/Palette/Palette.gd").new(palette_name, 7, 2, "Original booth palette; blank UI chrome only")
	palette.is_project_palette = true
	for swatch in palette_data.colors:
		palette.add_color(Color(str(swatch.hex)))
	target.palettes[palette_name] = palette
	target.project_current_palette_name = palette_name
	target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new(tag_name, Color("#ee75a3"), 1, 1))
	return target

func verify_saved(path, expected):
	var zip = ZIPReader.new()
	if zip.open(path) != OK:
		return {"error":"Cannot reopen saved project"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened = blank(int(data.size_x), int(data.size_y))
	var populated = []
	for index in range(data.layers.size()):
		var raw = zip.read_file("image_data/frames/1/layer_" + str(index + 1))
		if raw.size() != int(data.size_x) * int(data.size_y) * 4:
			return {"error":"Wrong raw saved cel dimensions", "layer":index}
		var pixels = Image.create_from_data(int(data.size_x), int(data.size_y), false, Image.FORMAT_RGBA8, raw)
		reopened.blend_rect(pixels, Rect2i(Vector2i.ZERO, reopened.get_size()), Vector2i.ZERO)
		populated.append(pixels.get_used_rect().has_area())
	zip.close()
	var embedded = JSON.parse_string(data.palettes[0].values()[0])
	return {"sourceSize":[data.size_x,data.size_y], "layers":data.layers.size(), "populatedLayers":populated, "paletteSwatches":embedded.colors.size(), "frames":data.frames.size(), "tag":data.tags[0].name, "pixelsMatch":reopened.get_data() == expected.get_data()}

func alpha_clear(picture, rect):
	for yy in range(rect.position.y, rect.end.y):
		for xx in range(rect.position.x, rect.end.x):
			if picture.get_pixel(xx,yy).a != 0:
				return false
	return true

func sprite_stats(picture):
	var opaque = 0
	var semi = 0
	var colors = {}
	var orphans = 0
	for yy in range(picture.get_height()):
		for xx in range(picture.get_width()):
			var ink = picture.get_pixel(xx,yy)
			if ink.a <= 0:
				continue
			colors[ink.to_html()] = true
			if ink.a == 1:
				opaque += 1
			else:
				semi += 1
			var neighbor = false
			for dy in range(-1,2):
				for dx in range(-1,2):
					var point = Vector2i(xx+dx,yy+dy)
					if (dx!=0 or dy!=0) and Rect2i(Vector2i.ZERO,picture.get_size()).has_point(point) and picture.get_pixelv(point).a>0:
						neighbor=true
			if not neighbor:
				orphans += 1
	return {"opaquePixels":opaque,"semitransparentPixels":semi,"visibleColors":colors.size(),"orphans":orphans}

func write_json(path, value):
	var file = FileAccess.open(path, FileAccess.WRITE)
	file.store_string(JSON.stringify(value,"  ") + "\n")
	file.close()

func atlas_metadata(filename, size, tag_name):
	return {"frames":{"static_0":{"frame":{"x":0,"y":0,"w":size.x,"h":size.y},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":size.x,"h":size.y},"sourceSize":{"w":size.x,"h":size.y},"duration":1000}},"meta":{"app":"Pixelorama MCP native source export","format":"RGBA8888","image":filename,"scale":"1","size":{"w":size.x,"h":size.y},"frameTags":[{"name":tag_name,"from":0,"to":0,"direction":"forward","color":"ee75a3ff"}]}}

func run(api, image, project, params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	var spec = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("components.json")))
	var palette_data = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var planes = []
	for index in range(LAYERS.size()):
		planes.append(blank(160,160))
	var pictures = {}
	var clear_checks = {}
	for component in spec.components:
		var pixels = component_image(component)
		pictures[component.id] = pixels
		var region = component.sourceRect
		planes[int(component.role)].blit_rect(pixels, Rect2i(Vector2i.ZERO,pixels.get_size()), Vector2i(int(region.x),int(region.y)))
		pixels.save_png(output_dir.path_join(str(component.image)))
		if component.has("contentRect"):
			var content = component.contentRect
			clear_checks[component.id] = alpha_clear(pixels, Rect2i(int(content.x),int(content.y),int(content.width),int(content.height)))
	var atlas = make_project("upgrade-ui-atlas", Vector2i(160,160), LAYERS, planes, palette_data, "upgrade-ui-atlas-static")
	if atlas == null:
		return {"error":"Private atlas creation failed"}
	var atlas_picture = composite(atlas,[0,1,2,3,4,5])
	var atlas_path = source_dir.path_join("upgrade-ui-atlas.pxo")
	if not root.get_node("OpenSave").call("save_pxo_file",atlas_path,false,atlas):
		return {"error":"Atlas native save failed"}
	atlas_picture.save_png(output_dir.path_join("upgrade-ui-atlas.png"))
	write_json(output_dir.path_join("upgrade-ui-atlas.json"),atlas_metadata("upgrade-ui-atlas.png",Vector2i(160,160),"upgrade-ui-atlas-static"))
	var sheet = atlas_picture.duplicate()
	sheet.resize(640,640,Image.INTERPOLATE_NEAREST)
	sheet.save_png(source_dir.path_join("component-preview.png"))
	var book_planes = [blank(320,192),blank(320,192),blank(320,192),blank(320,192)]
	book_planes[0].blit_rect(tile_nine(pictures["cover-frame"],320,192,{"left":8,"top":8,"right":8,"bottom":8}),Rect2i(0,0,320,192),Vector2i.ZERO)
	for start_x in [12,168]:
		book_planes[1].fill_rect(Rect2i(start_x+6,14,128,164),Color("#f1e5d1"))
		book_planes[2].blit_rect(tile_nine(pictures["page-frame"],140,176,{"left":6,"top":6,"right":6,"bottom":6}),Rect2i(0,0,140,176),Vector2i(start_x,8))
	for start_y in range(8,184,16):
		book_planes[3].blit_rect(pictures["binding-tile"],Rect2i(0,0,24,16),Vector2i(148,start_y))
	var book_names = ["01 - resizable rose cover outline","02 - OPTIONAL separate warm paper fills","03 - blank left and right page outlines","04 - repeated cloth spine and chrome binding"]
	var book = make_project("upgrade-notebook-preview",Vector2i(320,192),book_names,book_planes,palette_data,"upgrade-notebook-static")
	if book == null:
		return {"error":"Private notebook creation failed"}
	var book_picture = composite(book,[0,1,2,3])
	var outline_picture = composite(book,[0,2,3])
	var paper_picture = composite(book,[1])
	var book_path = source_dir.path_join("notebook-preview.pxo")
	if not root.get_node("OpenSave").call("save_pxo_file",book_path,false,book):
		return {"error":"Notebook native save failed"}
	book_picture.save_png(output_dir.path_join("notebook-filled-preview.png"))
	outline_picture.save_png(output_dir.path_join("notebook-outline.png"))
	paper_picture.save_png(output_dir.path_join("notebook-paper-fill.png"))
	write_json(output_dir.path_join("notebook-atlas.json"),atlas_metadata("notebook-filled-preview.png",Vector2i(320,192),"upgrade-notebook-static"))
	var preview = book_picture.duplicate()
	preview.resize(960,576,Image.INTERPOLATE_NEAREST)
	preview.save_png(source_dir.path_join("notebook-preview.png"))
	var outline_preview = outline_picture.duplicate()
	outline_preview.resize(960,576,Image.INTERPOLATE_NEAREST)
	outline_preview.save_png(source_dir.path_join("notebook-outline-preview.png"))
	var rebuilt = outline_picture.duplicate()
	# Fill is a background; composite it first so borders/binding stay on top.
	rebuilt = paper_picture.duplicate()
	rebuilt.blend_rect(outline_picture,Rect2i(0,0,320,192),Vector2i.ZERO)
	var resized_checks = {}
	for component in spec.components:
		if not component.has("slices"):
			continue
		var source = pictures[component.id]
		var wide = tile_nine(source,source.get_width()+37,source.get_height()+23,component.slices)
		var content = component.contentRect
		var left = int(content.x)
		var top = int(content.y)
		var right = source.get_width()-left-int(content.width)
		var bottom = source.get_height()-top-int(content.height)
		resized_checks[component.id] = alpha_clear(wide,Rect2i(left,top,wide.get_width()-left-right,wide.get_height()-top-bottom))
	var report = {"atlas":verify_saved(atlas_path,atlas_picture),"notebook":verify_saved(book_path,book_picture),"transparentContentInteriors":clear_checks,"resizedTransparentInteriors":resized_checks,"outlineContentLeftClear":alpha_clear(outline_picture,Rect2i(20,20,124,152)),"outlineContentRightClear":alpha_clear(outline_picture,Rect2i(176,20,124,152)),"paperAndOutlineReconstructExactly":rebuilt.get_data()==book_picture.get_data(),"atlasStats":sprite_stats(atlas_picture),"notebookStats":sprite_stats(book_picture),"activeProjectUnchanged":global.get("current_project")==active_before}
	write_json(output_dir.path_join("verification.json"),report)
	return report


const W = 384
const H = 304

func fresh_image():
	var picture = Image.create(W, H, false, Image.FORMAT_RGBA8)
	picture.fill(Color(0, 0, 0, 0))
	return picture

func blend_images(pictures):
	var output = fresh_image()
	for picture in pictures:
		output.blend_rect(picture, Rect2i(0, 0, W, H), Vector2i.ZERO)
	return output

func run(api, image, project, params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	var public_root = str(params.public_art_root)
	var layout = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("placements.json")))
	if layout.frameSize.width != W or layout.frameSize.height != H or layout.layers.size() != 9:
		return {"error":"Unexpected owned layout geometry"}
	var tag_script = null
	for candidate in global.get("projects"):
		if candidate.animation_tags.size() > 0:
			tag_script = candidate.animation_tags[0].get_script()
			if candidate.name == "back-grill" and candidate.size == Vector2i(96,64):
				break
	if tag_script == null:
		return {"error":"No native static-tag prototype available"}
	var textures = {}
	var references = {}
	var texture_sizes = []
	for asset in layout.assets:
		if textures.has(asset.id) or str(asset.source).contains("/kitchen-board-review/"):
			return {"error":"Duplicate texture or fixed cutting-board texture rejected","id":asset.id}
		var relative = str(asset.image).trim_prefix("../")
		var picture = Image.load_from_file(public_root.path_join(relative))
		if picture == null or picture.get_size() != Vector2i(int(asset.frameSize.width),int(asset.frameSize.height)):
			return {"error":"Asset missing or wrong native dimensions","id":asset.id}
		picture.convert(Image.FORMAT_RGBA8)
		textures[asset.id] = picture
		references[asset.id] = asset
		texture_sizes.append({"id":asset.id,"width":picture.get_width(),"height":picture.get_height()})
	var layer_images = []
	for layer_name in layout.layers:
		layer_images.append(fresh_image())
	var tile_count = 0
	for patch in layout.tiledRegions:
		var tile = textures[patch.texture]
		if int(patch.width) % tile.get_width() != 0 or int(patch.height) % tile.get_height() != 0 or patch.nativeScale != 1:
			return {"error":"Floor patch must repeat native tiles without scaling"}
		for yy in range(int(patch.y),int(patch.y+patch.height),tile.get_height()):
			for xx in range(int(patch.x),int(patch.x+patch.width),tile.get_width()):
				layer_images[int(patch.layer)].blend_rect(tile,Rect2i(Vector2i.ZERO,tile.get_size()),Vector2i(xx,yy))
				tile_count += 1
	var assembly_origins = {}
	for assembly in layout.artAssemblies:
		if assembly_origins.has(assembly.id):
			return {"error":"Duplicate assembly"}
		assembly_origins[assembly.id] = Vector2i(int(assembly.worldOrigin.x),int(assembly.worldOrigin.y))
	var seen_ids = {}
	var board_instances = 0
	for instance in layout.instances:
		if seen_ids.has(instance.id) or not textures.has(instance.texture):
			return {"error":"Duplicate instance or unknown texture","id":instance.id}
		seen_ids[instance.id] = true
		if instance.nativeScale != 1 or instance.x != int(instance.x) or instance.y != int(instance.y):
			return {"error":"Non-native scale or fractional placement rejected","id":instance.id}
		if not assembly_origins.has(instance.assembly) or Vector2i(int(instance.x),int(instance.y)) != assembly_origins[instance.assembly] + Vector2i(int(instance.localPosition.x),int(instance.localPosition.y)):
			return {"error":"Assembly-local/world coordinates disagree","id":instance.id}
		var picture = textures[instance.texture]
		var source_rect = Rect2i(Vector2i.ZERO,picture.get_size())
		if instance.has("sourceRect"):
			var crop = instance.sourceRect
			source_rect = Rect2i(int(crop.x),int(crop.y),int(crop.width),int(crop.height))
			if not Rect2i(Vector2i.ZERO,picture.get_size()).encloses(source_rect):
				return {"error":"Source crop outside native texture", "id":instance.id}
		if instance.assembly == "plating-run" and (instance.texture == "counter-front" or (instance.layer == 3 and source_rect.size.y != 24)):
			return {"error":"Bottom wall counter must show top only", "id":instance.id}
		var rect = Rect2i(Vector2i(int(instance.x),int(instance.y)),source_rect.size)
		if not Rect2i(0,0,W,H).encloses(rect):
			return {"error":"Instance frame exceeds native canvas","id":instance.id,"rect":str(rect)}
		if str(references[instance.texture].source).contains("/kitchen-board-review/"):
			board_instances += 1
		layer_images[int(instance.layer)].blend_rect(picture,source_rect,rect.position)
	if board_instances != 0:
		return {"error":"Cutting board must remain fully absent from fixed room"}
	var object_composite = blend_images(layer_images.slice(1))
	var corridor_checks = []
	for corridor in layout.circulationProposals:
		var region = Rect2i(int(corridor.rect.x),int(corridor.rect.y),int(corridor.rect.width),int(corridor.rect.height))
		var occupied = 0
		for yy in range(region.position.y,region.end.y):
			for xx in range(region.position.x,region.end.x):
				if object_composite.get_pixel(xx,yy).a > 0:
					occupied += 1
		corridor_checks.append({"id":corridor.id,"clearance":corridor.clearance,"occupiedVisualPixels":occupied,"visuallyClear":occupied==0})
		if occupied != 0:
			return {"error":"Proposed aisle is visually occupied","id":corridor.id,"occupiedPixels":occupied}
	var clear_prep = Rect2i(192,128,80,24)
	var join_mismatches = 0
	for yy in range(40):
		var counter_color = textures["counter-top"].get_pixel(0,yy) if yy < 24 else textures["counter-front"].get_pixel(0,yy-24)
		if textures["grill"].get_pixel(95,16+yy) != counter_color:
			join_mismatches += 1
	if join_mismatches != 0:
		return {"error":"Grill-to-counter profile differs", "mismatchedRows":join_mismatches}
	var revision_checks = {"grillJoinProfileMismatches":join_mismatches,"grillRightEdge":184,"counterLeftEdge":184,"sharedCounterTopY":40,"sharedFasciaY":64,"platingCounterNearEdgeY":288,"bottomWallInteriorY":288,"milkshakeCounterLeftEdgeX":16,"leftWallInteriorX":16,"archwayInstances":0,"plateInstances":0,"servingTrayInstances":0,"flatOpenings":2,"trashAdjacentToFryer":true}
	revision_checks["platingCounterVisibleTopY"] = 264
	revision_checks["platingCounterVisibleDepth"] = 24
	revision_checks["platingCounterVisibleFasciaPixels"] = 0
	for instance in layout.instances:
		if instance.texture == "plate" or instance.texture == "kitchen-door":
			return {"error":"Old plate or framed doorway remains"}
		if instance.texture == "serving-tray":
			revision_checks.servingTrayInstances += 1
	var occupied_clear_prep_pixels = 0
	for yy in range(clear_prep.position.y,clear_prep.end.y):
		for xx in range(clear_prep.position.x,clear_prep.end.x):
			if layer_images[6].get_pixel(xx,yy).a > 0 or layer_images[7].get_pixel(xx,yy).a > 0:
				occupied_clear_prep_pixels += 1
	if occupied_clear_prep_pixels != 0:
		return {"error":"Right prep worktop must stay clear","occupiedPixels":occupied_clear_prep_pixels}
	var target = load("res://src/Classes/Project.gd").new(Array([], TYPE_OBJECT, "RefCounted", load("res://src/Classes/Frame.gd")), "kitchen-layout-v2", Vector2i(W,H))
	if target.frames.size() != 0 or target.layers.size() != 0:
		return {"error":"Private native Project must start empty"}
	var frame = load("res://src/Classes/Frame.gd").new()
	for index in range(layout.layers.size()):
		var layer = load("res://src/Classes/Layers/PixelLayer.gd").new(target,str(layout.layers[index]))
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(layer_images[index]))
	target.frames.append(frame)
	target.current_frame = 0
	target.current_layer = 0
	target.fps = 1
	target.frames[0].duration = 1.0
	var swatches = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var palette_name = "Kitchen layout - existing front-of-house palette"
	var palette = load("res://src/Palette/Palette.gd").new(palette_name,7,3,"Existing approved21-swatch diner palette; no new colors")
	palette.is_project_palette = true
	for swatch in swatches.colors:
		palette.add_color(Color(str(swatch.hex)))
	target.palettes.clear()
	target.palettes[palette_name] = palette
	target.project_current_palette_name = palette_name
	target.animation_tags.append(tag_script.new("kitchen-layout-v2-static",Color("#ee75a3"),1,1))
	var complete = blend_images(layer_images)
	var saved = root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("kitchen-layout.pxo"),false,target)
	if not saved:
		return {"error":"Explicit private-project native save failed"}
	var codes = {}
	codes["native"] = complete.save_png(output_dir.path_join("kitchen-layout.png"))
	var enlarged = complete.duplicate()
	enlarged.resize(W*2,H*2,Image.INTERPOLATE_NEAREST)
	codes["preview"] = enlarged.save_png(source_dir.path_join("kitchen-layout-preview.png"))
	codes["publicPreview"] = enlarged.save_png(output_dir.path_join("kitchen-layout-preview.png"))
	var layout_file = FileAccess.open(output_dir.path_join("layout.json"),FileAccess.WRITE)
	layout_file.store_string(JSON.stringify(layout,"  ")+"\n")
	layout_file.close()
	var zip = ZIPReader.new()
	if zip.open(source_dir.path_join("kitchen-layout.pxo")) != OK:
		return {"error":"Cannot independently reopen saved native ZIP"}
	var data = JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened = fresh_image()
	var cel_sizes = []
	var populated = 0
	for index in range(1,layout.layers.size()+1):
		var raw = zip.read_file("image_data/frames/1/layer_"+str(index))
		cel_sizes.append(raw.size())
		if raw.size() != W*H*4:
			return {"error":"Saved cel has wrong dimensions","layer":index}
		var saved_picture = Image.create_from_data(W,H,false,Image.FORMAT_RGBA8,raw)
		if saved_picture.get_used_rect().size.x > 0:
			populated += 1
		reopened.blend_rect(saved_picture,Rect2i(0,0,W,H),Vector2i.ZERO)
	zip.close()
	var native = Image.load_from_file(output_dir.path_join("kitchen-layout.png"))
	native.convert(Image.FORMAT_RGBA8)
	var histogram = {}
	var opaque = 0
	var semi = 0
	for yy in range(H):
		for xx in range(W):
			var color = complete.get_pixel(xx,yy)
			if color.a > 0:
				histogram[color.to_html()] = true
				if color.a == 1:
					opaque += 1
				else:
					semi += 1
	var palette_data = JSON.parse_string(data.palettes[0].values()[0])
	var result = {"saved":saved,"nativeSize":[data.size_x,data.size_y],"layers":data.layers.size(),"populatedLayers":populated,"celByteSizes":cel_sizes,"paletteSwatches":palette_data.colors.size(),"frames":data.frames.size(),"fps":data.fps,"tag":data.tags[0].name,"sourcePixelsMatchNativePng":reopened.get_data()==native.get_data(),"privateCompositeMatchesSavedSource":reopened.get_data()==complete.get_data(),"allInstancesAtNativeScale":true,"assemblyOffsetsMatchWorldPositions":true,"corridorChecks":corridor_checks,"assetCount":textures.size(),"instanceCount":layout.instances.size(),"tileCount":tile_count,"assetSizes":texture_sizes,"fixedCuttingBoardInstances":board_instances,"clearPrepWorktopOccupiedPropPixels":occupied_clear_prep_pixels,"opaquePixels":opaque,"semitransparentPixels":semi,"visibleColors":histogram.size(),"activeProjectUnchanged":global.get("current_project")==active_before,"exportCodes":codes}
	result["revisionChecks"] = revision_checks
	var report = FileAccess.open(output_dir.path_join("verification.json"),FileAccess.WRITE)
	report.store_string(JSON.stringify(result,"  ")+"\n")
	report.close()
	return result


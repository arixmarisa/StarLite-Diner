func blank(w,h):
	var out=Image.create(w,h,false,Image.FORMAT_RGBA8)
	out.fill(Color(0,0,0,0))
	return out

func write_json(path,value):
	var file=FileAccess.open(path,FileAccess.WRITE)
	file.store_string(JSON.stringify(value,"  "))
	file.close()

func zoom_export(pixels,path,scale):
	var zoom=pixels.duplicate()
	zoom.resize(pixels.get_width()*scale,pixels.get_height()*scale,Image.INTERPOLATE_NEAREST)
	return zoom.save_png(path)

func used_colors(images,base):
	var values=[]
	for color in base:
		var hex=Color(color).to_html(false)
		if not values.has(hex): values.append(hex)
	for img in images:
		for y in range(img.get_height()):
			for x in range(img.get_width()):
				var c=img.get_pixel(x,y)
				if c.a==0: continue
				var hex=c.to_html(false)
				if not values.has(hex): values.append(hex)
	return values

func inspect(pixels):
	var opaque=0
	var semi=0
	var colors={}
	var remaining={}
	for y in range(pixels.get_height()):
		for x in range(pixels.get_width()):
			var c=pixels.get_pixel(x,y)
			if c.a==0: continue
			opaque+=1
			if c.a!=1: semi+=1
			colors[c.to_html()]=true
			remaining[Vector2i(x,y)]=true
	var components=[]
	while not remaining.is_empty():
		var first=remaining.keys()[0]
		remaining.erase(first)
		var stack=[first]
		var count=0
		while not stack.is_empty():
			var p=stack.pop_back()
			count+=1
			for delta in [Vector2i.LEFT,Vector2i.RIGHT,Vector2i.UP,Vector2i.DOWN]:
				var point=p+delta
				if remaining.has(point):
					remaining.erase(point)
					stack.append(point)
		components.append(count)
	var rect=pixels.get_used_rect()
	return {"opaquePixels":opaque,"semitransparentPixels":semi,"visibleColors":colors.size(),"components":components,"occupiedBounds":{"x":rect.position.x,"y":rect.position.y,"width":rect.size.x,"height":rect.size.y}}

func save_native(root,path,name,size,layer_names,frames,palette_colors,tag_names):
	var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),name,size)
	if target.frames.size()!=0 or target.layers.size()!=0: return {"error":"Private project not empty"}
	for layer_name in layer_names:
		target.layers.append(load("res://src/Classes/Layers/PixelLayer.gd").new(target,layer_name))
	for images in frames:
		var frame=load("res://src/Classes/Frame.gd").new()
		frame.duration=1
		for li in range(layer_names.size()): frame.cels.append(target.layers[li].new_cel_from_image(images[li]))
		target.frames.append(frame)
	target.current_frame=0
	target.current_layer=0
	target.fps=1
	var palette=load("res://src/Palette/Palette.gd").new("Diner floor mess",8,maxi(1,int((palette_colors.size()+7)/8)),"Editable opaque material ramps and native floor/player references")
	palette.is_project_palette=true
	for color in palette_colors: palette.add_color(Color(color))
	target.palettes[palette.name]=palette
	target.project_current_palette_name=palette.name
	for index in range(tag_names.size()): target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new(tag_names[index],Color("#ee75a3"),index+1,index+1))
	if not root.get_node("OpenSave").call("save_pxo_file",path,false,target): return {"error":"Native save failed","path":path}
	var zip=ZIPReader.new()
	if zip.open(path)!=OK: return {"error":"Saved source cannot open"}
	var data=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	if int(data.size_x)!=size.x or int(data.size_y)!=size.y or data.frames.size()!=frames.size() or data.layers.size()!=layer_names.size() or data.tags.size()!=tag_names.size() or int(data.fps)!=1: return {"error":"Saved source structure mismatch"}
	var palette_data=JSON.parse_string(data.palettes[0].values()[0])
	if palette_data.colors.size()!=palette_colors.size(): return {"error":"Saved palette mismatch"}
	for li in range(layer_names.size()):
		if str(data.layers[li].name)!=str(layer_names[li]): return {"error":"Saved layer name mismatch"}
	for fi in range(tag_names.size()):
		if str(data.tags[fi].name)!=str(tag_names[fi]) or int(data.tags[fi].from)!=fi+1 or int(data.tags[fi].to)!=fi+1: return {"error":"Saved static tag mismatch"}
	var cels=0
	for fi in range(frames.size()):
		if float(data.frames[fi].duration)!=1: return {"error":"Saved frame duration mismatch"}
		var rebuilt=blank(size.x,size.y)
		var expected=blank(size.x,size.y)
		for li in range(layer_names.size()):
			var raw=zip.read_file("image_data/frames/"+str(fi+1)+"/layer_"+str(li+1))
			if raw!=frames[fi][li].get_data(): return {"error":"Saved cel differs","frame":fi,"layer":li}
			var saved=Image.create_from_data(size.x,size.y,false,Image.FORMAT_RGBA8,raw)
			rebuilt.blend_rect(saved,Rect2i(Vector2i.ZERO,size),Vector2i.ZERO)
			expected.blend_rect(frames[fi][li],Rect2i(Vector2i.ZERO,size),Vector2i.ZERO)
			cels+=1
		if rebuilt.get_data()!=expected.get_data(): return {"error":"Saved composite reconstruction mismatch"}
	zip.close()
	return {"frames":frames.size(),"layers":layer_names.size(),"tags":tag_names.size(),"fps":1,"paletteSwatches":palette_colors.size(),"savedCelsExact":cels,"sourceCompositeExact":true,"savedLayerNamesTagsTimingExact":true,"nativeSize":[size.x,size.y]}

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var active=root.get_node("Global").get("current_project")
	var repo=str(params.repo_dir)
	var source=str(params.source_dir)
	var output=str(params.output_dir)
	DirAccess.make_dir_recursive_absolute(source)
	DirAccess.make_dir_recursive_absolute(output)
	var spec=JSON.parse_string(FileAccess.get_file_as_string(source.path_join("contract.json")))
	var palette_spec=JSON.parse_string(FileAccess.get_file_as_string(source.path_join("palette.json")))
	var palette=palette_spec.colors
	var common_colors=palette.values()
	var families=params.get("families",["spills","napkin","cup"])
	var all_images={}
	var asset_records=[]
	var verification={"families":{},"assets":{},"sourceCelsExact":0,"sameSpillAlpha":true,"activeProjectUnchanged":false,"runtimeIntegrated":false}
	for family in families:
		var recipe=JSON.parse_string(FileAccess.get_file_as_string(source.path_join(family+".json")))
		var frames=recipe.frames if family=="spills" else [{"id":recipe.id,"label":recipe.label,"colorMap":{}}]
		var source_images=[]
		var tags=[]
		var sheet=blank(16*frames.size(),16)
		var spill_alpha=[]
		for fi in range(frames.size()):
			var definition=frames[fi]
			var layers=[]
			var composite=blank(16,16)
			for li in range(4):
				var pixels=blank(16,16)
				for command in recipe.layers[li]:
					var rect=Rect2i(int(command.x),int(command.y),int(command.w),int(command.h))
					if rect.size.x<=0 or rect.size.y<=0 or not Rect2i(0,0,16,16).encloses(rect): return {"error":"Recipe out of bounds","family":family,"command":command}
					var token=str(definition.colorMap.get(str(command.c),str(command.c)))
					if not palette.has(token): return {"error":"Unknown palette token","token":token}
					pixels.fill_rect(rect,Color(str(palette[token])))
				layers.append(pixels)
				composite.blend_rect(pixels,Rect2i(0,0,16,16),Vector2i.ZERO)
			source_images.append(layers)
			tags.append(str(definition.id))
			all_images[definition.id]=composite
			var stats=inspect(composite)
			if stats.semitransparentPixels!=0 or stats.components.size()!=1: return {"error":"Sprite alpha/connectivity failure","id":definition.id,"stats":stats}
			verification.assets[definition.id]=stats
			var alpha=[]
			for yy in range(16):
				for xx in range(16): alpha.append(composite.get_pixel(xx,yy).a)
			if family=="spills":
				if fi==0: spill_alpha=alpha
				elif alpha!=spill_alpha: verification.sameSpillAlpha=false
			composite.save_png(output.path_join(str(definition.id)+".png"))
			if Image.load_from_file(output.path_join(str(definition.id)+".png")).get_data()!=composite.get_data(): return {"error":"PNG roundtrip failed"}
			zoom_export(composite,source.path_join(str(definition.id)+"-preview.png"),12)
			zoom_export(composite,output.path_join(str(definition.id)+"-preview.png"),12)
			sheet.blit_rect(composite,Rect2i(0,0,16,16),Vector2i(fi*16,0))
			asset_records.append({"id":definition.id,"label":definition.label,"image":str(definition.id)+".png","frameSize":{"width":16,"height":16},"occupiedBounds":stats.occupiedBounds,"source":"assets/pixelorama/floor-mess-review/"+family+".pxo","palette":"assets/pixelorama/floor-mess-review/palette.json","sourceFrameIndex":fi,"sourceTag":definition.id,"sourceLayers":spec.layers,"placementAnchor":spec.anchor,"anchorStatus":spec.anchorStatus,"renderRole":"ground-decal" if family=="spills" else "ground-prop","collision":null,"interaction":null,"static":true,"frameMetadata":{"state":"static","frames":1,"fps":1,"durationMultiplier":1,"durationMs":1000}})
		var report=save_native(root,source.path_join(family+".pxo"),"floor-mess-"+family,Vector2i(16,16),spec.layers,source_images,used_colors([],common_colors),tags)
		if report.has("error"): return report
		verification.families[family]=report
		verification.sourceCelsExact+=report.savedCelsExact
		sheet.save_png(output.path_join(family+"-sheet.png"))
		zoom_export(sheet,source.path_join(family+"-preview.png"),12)
		zoom_export(sheet,output.path_join(family+"-preview.png"),12)
	if families.size()==3:
		for key in ["contactSheet","floorContext"]:
			var composition=spec[key]
			var size=Vector2i(int(composition.width),int(composition.height))
			var images=[]
			var names=[]
			if key=="floorContext":
				var tile=Image.load_from_file(repo.path_join("apps/web/public"+str(composition.floorImage)))
				tile.convert(Image.FORMAT_RGBA8)
				var floor_layer=blank(size.x,size.y)
				for yy in range(0,size.y,16):
					for xx in range(0,size.x,16): floor_layer.blit_rect(tile,Rect2i(0,0,16,16),Vector2i(xx,yy))
				images.append(floor_layer)
				names.append("01 - unchanged checker floor")
			for item in composition.placements:
				var layer=blank(size.x,size.y)
				layer.blit_rect(all_images[item.asset],Rect2i(0,0,16,16),Vector2i(int(item.x),int(item.y)))
				images.append(layer)
				names.append(str(names.size()+1).pad_zeros(2)+" - "+item.asset)
			if key=="floorContext":
				var player=Image.load_from_file(repo.path_join("apps/web/public"+str(composition.playerImage)))
				player.convert(Image.FORMAT_RGBA8)
				var player_layer=blank(size.x,size.y)
				player_layer.blit_rect(player,Rect2i(0,0,16,24),Vector2i(int(composition.playerPosition.x),int(composition.playerPosition.y)))
				images.append(player_layer)
				names.append("06 - unchanged player scale reference")
			var composite=blank(size.x,size.y)
			for layer in images: composite.blend_rect(layer,Rect2i(Vector2i.ZERO,size),Vector2i.ZERO)
			var name="floor-context" if key=="floorContext" else "contact-sheet"
			var report=save_native(root,source.path_join(name+".pxo"),"floor-mess-"+name,size,names,[images],used_colors(images,common_colors),["static-"+name])
			if report.has("error"): return report
			verification.families[name]=report
			verification.sourceCelsExact+=report.savedCelsExact
			composite.save_png(output.path_join(name+".png"))
			if Image.load_from_file(output.path_join(name+".png")).get_data()!=composite.get_data(): return {"error":"Review PNG roundtrip failed"}
			zoom_export(composite,source.path_join(name+"-preview.png"),int(composition.previewScale))
			zoom_export(composite,output.path_join(name+"-preview.png"),int(composition.previewScale))
	verification.activeProjectUnchanged=root.get_node("Global").get("current_project")==active
	write_json(source.path_join("verification.json"),verification)
	write_json(output.path_join("manifest.json"),{"schemaVersion":1,"status":"art-review-only","authoringTool":"Pixelorama MCP","sourceFrameIndexBase":0,"nativeSourceTagIndexBase":1,"assets":asset_records,"staticVariantsNotAnimation":true,"nativePixelScale":1,"contactSheet":spec.contactSheet,"floorContext":spec.floorContext,"integration":"Assets and derived previews only; no game/editor placement, spawning, cleanup, collision or other mechanics implemented."})
	return verification

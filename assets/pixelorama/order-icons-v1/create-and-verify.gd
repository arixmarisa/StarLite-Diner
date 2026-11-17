func blank(width,height):
	var output=Image.create(width,height,false,Image.FORMAT_RGBA8)
	output.fill(Color(0,0,0,0))
	return output

func write_json(path,value):
	var file=FileAccess.open(path,FileAccess.WRITE)
	file.store_string(JSON.stringify(value,"  ")+"\n")
	file.close()

func colors_of(picture):
	var colors=[]
	for y in range(picture.get_height()):
		for x in range(picture.get_width()):
			var ink=picture.get_pixel(x,y)
			if ink.a>0:
				var hex="#"+ink.to_html(false)
				if not colors.has(hex): colors.append(hex)
	return colors

func composite(pictures,size):
	var output=blank(size.x,size.y)
	for image in pictures: output.blend_rect(image,Rect2i(Vector2i.ZERO,size),Vector2i.ZERO)
	return output

func stats(picture):
	var opaque=0
	var semi=0
	var remaining={}
	for y in range(picture.get_height()):
		for x in range(picture.get_width()):
			var ink=picture.get_pixel(x,y)
			if ink.a>0:
				remaining[Vector2i(x,y)]=true
				if ink.a==1: opaque+=1
				else: semi+=1
	var components=0
	while not remaining.is_empty():
		components+=1
		var first=remaining.keys()[0]
		remaining.erase(first)
		var queue=[first]
		while not queue.is_empty():
			var current=queue.pop_back()
			for delta in [Vector2i.LEFT,Vector2i.RIGHT,Vector2i.UP,Vector2i.DOWN]:
				var point=current+delta
				if remaining.has(point):
					remaining.erase(point)
					queue.append(point)
	var bounds=picture.get_used_rect()
	return {"opaquePixels":opaque,"semitransparentPixels":semi,"visibleColors":colors_of(picture).size(),"components":components,"occupiedBounds":{"x":bounds.position.x,"y":bounds.position.y,"width":bounds.size.x,"height":bounds.size.y}}

func project_base(name,size,names,colors):
	var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),name,size)
	for layer_name in names: target.layers.append(load("res://src/Classes/Layers/PixelLayer.gd").new(target,str(layer_name)))
	var palette=load("res://src/Palette/Palette.gd").new(name+" palette",8,maxi(1,int(ceil(colors.size()/8.0))),"Diner order icons; static variants, not animation")
	palette.is_project_palette=true
	for color in colors: palette.add_color(Color(str(color)))
	target.palettes[palette.name]=palette
	target.project_current_palette_name=palette.name
	target.fps=1
	target.current_layer=0
	target.current_frame=0
	return target

func verify_saved(path,size,names,frames,tag_names):
	var zip=ZIPReader.new()
	if zip.open(path)!=OK: return {"error":"Cannot open saved source"}
	var data=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	if int(data.size_x)!=size.x or int(data.size_y)!=size.y or data.layers.size()!=names.size() or data.frames.size()!=frames.size() or data.tags.size()!=tag_names.size() or int(data.fps)!=1: return {"error":"Saved native metadata differs"}
	var cels=0
	for fi in range(frames.size()):
		if str(data.tags[fi].name)!=str(tag_names[fi]) or int(data.tags[fi].from)!=fi+1 or int(data.tags[fi].to)!=fi+1: return {"error":"Saved static tag differs"}
		var rebuilt=blank(size.x,size.y)
		for li in range(names.size()):
			if str(data.layers[li].name)!=str(names[li]): return {"error":"Layer names differ"}
			var raw=zip.read_file("image_data/frames/"+str(fi+1)+"/layer_"+str(li+1))
			if raw!=frames[fi][li].get_data(): return {"error":"Saved cel differs","frame":fi,"layer":li}
			var image=Image.create_from_data(size.x,size.y,false,Image.FORMAT_RGBA8,raw)
			rebuilt.blend_rect(image,Rect2i(Vector2i.ZERO,size),Vector2i.ZERO)
			cels+=1
		if rebuilt.get_data()!=composite(frames[fi],size).get_data(): return {"error":"Saved composite differs"}
	zip.close()
	var palette=JSON.parse_string(data.palettes[0].values()[0])
	return {"size":[size.x,size.y],"frames":frames.size(),"layers":names.size(),"tags":tag_names.size(),"fps":1,"paletteSwatches":palette.colors.size(),"savedCelsExact":cels,"sourceCompositesExact":true}

func render_icon(item):
	var pictures=[]
	if item.rectangles.size()!=5: return {"error":"Five source roles required"}
	for commands in item.rectangles:
		var picture=blank(16,16)
		for c in commands:
			var region=Rect2i(int(c.x),int(c.y),int(c.w),int(c.h))
			if region.size.x<1 or region.size.y<1 or not Rect2i(0,0,16,16).encloses(region) or not item.palette.has(str(c.c)): return {"error":"Invalid command","id":item.id}
			picture.fill_rect(region,Color(str(item.palette[str(c.c)])))
		pictures.append(picture)
	return {"pictures":pictures,"image":composite(pictures,Vector2i(16,16))}

func preview(picture,path,factor):
	var enlarged=picture.duplicate()
	enlarged.resize(picture.get_width()*factor,picture.get_height()*factor,Image.INTERPOLATE_NEAREST)
	return enlarged.save_png(path)

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var active_before=root.get_node("Global").get("current_project")
	var source=str(params.source_dir)
	var output=str(params.output_dir)
	var repo=str(params.repo_dir)
	DirAccess.make_dir_recursive_absolute(output)
	DirAccess.make_dir_recursive_absolute(source.path_join("palettes"))
	DirAccess.make_dir_recursive_absolute(output.path_join("palettes"))
	var burger_path=repo.path_join("apps/web/public/art/order-bubble-review/burger.png")
	var burger=Image.load_from_file(burger_path)
	if burger.get_size()!=Vector2i(16,16): return {"error":"Wrong approved burger reference"}
	var burger_data=burger.get_data()
	var bubble_manifest=JSON.parse_string(FileAccess.get_file_as_string(repo.path_join("apps/web/public/art/order-bubble-review/manifest.json")))
	var bubble={}
	for item in bubble_manifest.assets:
		if str(item.id)=="speech-bubble-empty": bubble=item
	if bubble.is_empty() or int(bubble.contentRect.width)<16 or int(bubble.contentRect.height)<16: return {"error":"Approved bubble does not fit icons"}
	var reports={"families":{},"icons":{},"failures":[],"approvedBurgerReused":true,"newIcons":30,"totalIcons":31}
	var entries=[{"id":"burger","label":"Burger","kind":"base-food","usage":"Approved plain bun and patty; optional toppings remain separate.","image":"/art/order-bubble-review/burger.png","source":"assets/pixelorama/order-bubble-review/burger.pxo","sourceFrameIndex":0,"frameIndex":0,"palette":"/art/order-bubble-review/burger-palette.json","static":{"frames":[0],"fps":1,"tag":"burger-icon-static"},"frameSize":{"width":16,"height":16},"reused":true,"renderRole":"world-overlay","collision":null,"interaction":null}]
	var pictures={"burger":burger}
	var pixel_signatures={burger_data.hex_encode():"burger"}
	var family_meta={}
	for family in ["savory","sweet","drinks"]:
		var definition=JSON.parse_string(FileAccess.get_file_as_string(source.path_join(family+".json")))
		if definition.icons.size()!=10 or definition.layers.size()!=5: return {"error":"Expected ten icons/five layers","family":family}
		var palette_colors=[]
		for item in definition.icons:
			for color in item.palette.values():
				if not palette_colors.has(str(color)): palette_colors.append(str(color))
		var target=project_base("order-icons-"+family,Vector2i(16,16),definition.layers,palette_colors)
		var sheet=blank(160,16)
		var family_preview=blank(200,24)
		var frames=[]
		var tags=[]
		var atlas_frames={}
		var atlas_tags=[]
		for fi in range(10):
			var item=definition.icons[fi]
			var id=str(item.id)
			var rendered=render_icon(item)
			if rendered.has("error"): return rendered
			var state=stats(rendered.image)
			var intentional=str(item.get("intentionalDisconnectedBits",""))
			if state.semitransparentPixels!=0 or state.visibleColors<6 or state.visibleColors>12 or (state.components!=int(item.get("expectedComponents",1))): return {"error":"Icon alpha/palette/connectivity issue","id":id,"stats":state}
			var signature=rendered.image.get_data().hex_encode()
			if pixel_signatures.has(signature): return {"error":"Duplicate icon pixels","id":id,"other":pixel_signatures[signature]}
			pixel_signatures[signature]=id
			var frame=load("res://src/Classes/Frame.gd").new()
			frame.duration=1.0
			for li in range(5): frame.cels.append(target.layers[li].new_cel_from_image(rendered.pictures[li]))
			target.frames.append(frame)
			target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new(id,Color("#ee75a3"),fi+1,fi+1))
			frames.append(rendered.pictures)
			tags.append(id)
			var png_path=output.path_join(id+".png")
			if rendered.image.save_png(png_path)!=OK: return {"error":"Icon PNG export failed"}
			if Image.load_from_file(png_path).get_data()!=rendered.image.get_data(): return {"error":"Icon PNG roundtrip failed","id":id}
			pictures[id]=rendered.image
			sheet.blit_rect(rendered.image,Rect2i(0,0,16,16),Vector2i(fi*16,0))
			family_preview.blit_rect(rendered.image,Rect2i(0,0,16,16),Vector2i(fi*20+2,4))
			var palette_record={"id":id,"colors":item.palette}
			write_json(source.path_join("palettes/"+id+".json"),palette_record)
			write_json(output.path_join("palettes/"+id+".json"),palette_record)
			var entry={"id":id,"label":str(item.label),"kind":str(item.kind),"usage":str(item.usage),"image":id+".png","family":family,"source":"assets/pixelorama/order-icons-v1/"+family+".pxo","sourceFrameIndex":fi,"familyFrameIndex":fi,"frameIndex":0,"familySheetRect":{"x":fi*16,"y":0,"width":16,"height":16},"frameSize":{"width":16,"height":16},"palette":"palettes/"+id+".json","paletteSource":"assets/pixelorama/order-icons-v1/palettes/"+id+".json","static":{"frames":[0],"fps":1,"tag":id},"renderRole":"world-overlay","collision":null,"interaction":null,"reused":false,"transparentExterior":true}
			if intentional!="":
				entry.intentionalDisconnectedBits=intentional
				entry.expectedComponents=int(item.get("expectedComponents",1))
			entries.append(entry)
			reports.icons[id]=state
			atlas_frames[id]={"frame":{"x":fi*16,"y":0,"w":16,"h":16},"rotated":false,"trimmed":false,"spriteSourceSize":{"x":0,"y":0,"w":16,"h":16},"sourceSize":{"w":16,"h":16},"duration":1000}
			atlas_tags.append({"name":id,"from":fi,"to":fi,"direction":"forward","color":"ee75a3ff"})
		if not root.get_node("OpenSave").call("save_pxo_file",source.path_join(family+".pxo"),false,target): return {"error":"Family source save failed"}
		var proof=verify_saved(source.path_join(family+".pxo"),Vector2i(16,16),definition.layers,frames,tags)
		if proof.has("error"): return proof
		reports.families[family]=proof
		sheet.save_png(output.path_join(family+"-sheet.png"))
		preview(family_preview,source.path_join(family+"-preview.png"),6)
		preview(family_preview,output.path_join(family+"-preview.png"),6)
		write_json(source.path_join(family+"-palette.json"),{"name":family+" icon palette","colors":palette_colors})
		write_json(output.path_join(family+"-palette.json"),{"name":family+" icon palette","colors":palette_colors})
		write_json(output.path_join(family+"-atlas.json"),{"frames":atlas_frames,"meta":{"app":"Pixelorama MCP","image":family+"-sheet.png","format":"RGBA8888","size":{"w":160,"h":16},"scale":"1","frameTags":atlas_tags},"frameIndexBase":0,"tagIndexBase":0})
		family_meta[family]={"source":"assets/pixelorama/order-icons-v1/"+family+".pxo","sheet":family+"-sheet.png","atlas":family+"-atlas.json","preview":family+"-preview.png","palette":family+"-palette.json","frames":10,"layers":definition.layers,"fps":1,"nativeTagIndexBase":1,"atlasFrameIndexBase":0,"atlasTagIndexBase":0,"note":"Ten static icon variants; not an animation."}
	var contact_size=Vector2i(192,96)
	var contact=blank(contact_size.x,contact_size.y)
	var contact_layers=[]
	var contact_names=[]
	var contact_palette=[]
	var contact_items=[]
	for index in range(entries.size()):
		var entry=entries[index]
		var id=str(entry.id)
		var origin=Vector2i((index%8)*24+4,int(index/8)*24+4)
		var plane=blank(contact_size.x,contact_size.y)
		plane.blit_rect(pictures[id],Rect2i(0,0,16,16),origin)
		contact_layers.append(plane)
		contact_names.append(str(index+1)+" - "+id)
		contact.blend_rect(plane,Rect2i(Vector2i.ZERO,contact_size),Vector2i.ZERO)
		for color in colors_of(pictures[id]):
			if not contact_palette.has(color): contact_palette.append(color)
		contact_items.append({"id":id,"label":entry.label,"image":entry.image,"x":origin.x,"y":origin.y,"width":16,"height":16})
	var review=project_base("order-icon-contact-sheet",contact_size,contact_names,contact_palette)
	var review_frame=load("res://src/Classes/Frame.gd").new()
	review_frame.duration=1.0
	for index in range(contact_layers.size()): review_frame.cels.append(review.layers[index].new_cel_from_image(contact_layers[index]))
	review.frames.append(review_frame)
	review.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new("order-icon-contact-sheet-static",Color("#ee75a3"),1,1))
	if not root.get_node("OpenSave").call("save_pxo_file",source.path_join("contact-sheet.pxo"),false,review): return {"error":"Contact source save failed"}
	reports.contactSheet=verify_saved(source.path_join("contact-sheet.pxo"),contact_size,contact_names,[contact_layers],["order-icon-contact-sheet-static"])
	if reports.contactSheet.has("error"): return reports.contactSheet
	contact.save_png(output.path_join("contact-sheet.png"))
	preview(contact,source.path_join("contact-sheet-preview.png"),6)
	preview(contact,output.path_join("contact-sheet-preview.png"),6)
	var contact_meta={"image":"contact-sheet.png","preview":"contact-sheet-preview.png","source":"assets/pixelorama/order-icons-v1/contact-sheet.pxo","size":{"width":192,"height":96},"columns":8,"cellSize":24,"padding":4,"previewScale":6,"items":contact_items,"purpose":"Review only; not a third content family or a runtime order layout."}
	write_json(output.path_join("manifest.json"),{"schemaVersion":1,"status":"complete-art-catalog","sourcePathBase":"repository-root","newIcons":30,"reusedIcons":1,"totalIcons":31,"frameSize":{"width":16,"height":16},"families":family_meta,"icons":entries,"contactSheet":contact_meta,"approvedBubble":{"image":"/art/order-bubble-review/bubble.png","source":"assets/pixelorama/order-bubble-review/bubble.pxo","contentRect":bubble.contentRect,"exampleIconPlacement":{"x":8,"y":3}},"integration":"No runtime ordering, display sequence, notepad, gameplay or availability implementation. Upgrade-listed icons remain art only."})
	write_json(source.path_join("contact-sheet.json"),contact_meta)
	reports.approvedBurgerPixelsUnchanged=Image.load_from_file(burger_path).get_data()==burger_data
	reports.all31DecodedImagesDistinct=pixel_signatures.size()==31
	reports.allFitApprovedBubble=true
	reports.activeProjectUnchanged=root.get_node("Global").get("current_project")==active_before
	write_json(source.path_join("verification.json"),reports)
	return reports

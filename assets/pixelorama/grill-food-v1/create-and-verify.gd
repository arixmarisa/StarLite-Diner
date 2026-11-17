func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var global=root.get_node("Global")
	var active=global.get("current_project")
	var tag_script=null
	for candidate in global.get("projects"):
		if candidate.animation_tags.size()>0:
			tag_script=candidate.animation_tags[0].get_script()
			break
	if tag_script==null:
		return {"error":"Missing native tag prototype"}
	var source_dir=str(params.source_dir)
	var output_dir=str(params.output_dir)
	var names=["01 - griddle contact shadow","02 - batter silhouette and edge","03 - warm raw batter body","04 - upper-left soft highlights"]
	var pictures=[]
	for index in range(4):
		var pic=Image.create(12,10,false,Image.FORMAT_RGBA8)
		pic.fill(Color.TRANSPARENT)
		pictures.append(pic)
	pictures[0].fill_rect(Rect2i(3,7,7,1),Color("#46404b"))
	pictures[0].fill_rect(Rect2i(4,8,5,1),Color("#46404b"))
	for row in [[4,2,4],[3,3,6],[2,4,8],[2,5,8],[3,6,6],[4,7,4]]:
		pictures[1].fill_rect(Rect2i(row[0],row[1],row[2],1),Color("#322c38"))
	for row in [[4,3,4],[3,4,6],[3,5,6],[4,6,4]]:
		pictures[2].fill_rect(Rect2i(row[0],row[1],row[2],1),Color("#f1e5d1"))
	pictures[3].fill_rect(Rect2i(4,3,3,1),Color("#fff5df"))
	pictures[3].fill_rect(Rect2i(3,4,3,1),Color("#fff5df"))
	pictures[3].set_pixel(7,5,Color("#fff0d5"))
	var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"raw-pancake-batter",Vector2i(12,10))
	var frame=load("res://src/Classes/Frame.gd").new()
	var complete=Image.create(12,10,false,Image.FORMAT_RGBA8)
	complete.fill(Color.TRANSPARENT)
	for index in range(names.size()):
		var layer=load("res://src/Classes/Layers/PixelLayer.gd").new(target,names[index])
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pictures[index]))
		complete.blend_rect(pictures[index],Rect2i(0,0,12,10),Vector2i.ZERO)
	target.frames.append(frame)
	target.current_frame=0
	target.current_layer=0
	target.fps=1
	frame.duration=1.0
	var swatches=JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var palette=load("res://src/Palette/Palette.gd").new("Raw grill food - original kitchen palette",7,2,"Existing14swatches")
	palette.is_project_palette=true
	for swatch in swatches.colors:
		palette.add_color(Color(str(swatch.hex)))
	target.palettes.clear()
	target.palettes["Raw grill food - original kitchen palette"]=palette
	target.project_current_palette_name="Raw grill food - original kitchen palette"
	target.animation_tags.append(tag_script.new("raw-pancake-batter-static",Color("#ee75a3"),1,1))
	var saved=root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("pancake-batter.pxo"),false,target)
	if not saved:
		return {"error":"Explicit native save failed"}
	complete.save_png(output_dir.path_join("pancake-batter.png"))
	complete.save_png(output_dir.path_join("pancake-batter-atlas.png"))
	var preview=complete.duplicate()
	preview.resize(120,100,Image.INTERPOLATE_NEAREST)
	preview.save_png(source_dir.path_join("pancake-batter-preview.png"))
	var zip=ZIPReader.new()
	if zip.open(source_dir.path_join("pancake-batter.pxo"))!=OK:
		return {"error":"Cannot independently reopen saved sprite"}
	var metadata=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var rebuilt=Image.create(12,10,false,Image.FORMAT_RGBA8)
	rebuilt.fill(Color.TRANSPARENT)
	var cel_sizes=[]
	for index in range(names.size()):
		var bytes=zip.read_file("image_data/frames/1/layer_"+str(index+1))
		cel_sizes.append(bytes.size())
		if bytes.size()!=480:
			return {"error":"Wrong native cel size"}
		rebuilt.blend_rect(Image.create_from_data(12,10,false,Image.FORMAT_RGBA8,bytes),Rect2i(0,0,12,10),Vector2i.ZERO)
	zip.close()
	var opaque=0
	var semi=0
	var orphans=0
	var colors={}
	for y in range(10):
		for x in range(12):
			var color=complete.get_pixel(x,y)
			if color.a>0:
				opaque+=1
				colors[color.to_html()]=true
				if color.a<1:
					semi+=1
				var neighbor=false
				for offset in [Vector2i.LEFT,Vector2i.RIGHT,Vector2i.UP,Vector2i.DOWN]:
					var p=Vector2i(x,y)+offset
					if p.x>=0 and p.x<12 and p.y>=0 and p.y<10 and complete.get_pixel(p.x,p.y).a>0:
						neighbor=true
				if not neighbor:
					orphans+=1
	var rect=complete.get_used_rect()
	var report={"savedSourceMatchesPng":rebuilt.get_data()==complete.get_data(),"nativeSize":[metadata.size_x,metadata.size_y],"layers":metadata.layers.size(),"celByteSizes":cel_sizes,"paletteSwatches":14,"frames":metadata.frames.size(),"fps":metadata.fps,"tag":metadata.tags[0].name,"opaquePixels":opaque,"semitransparentPixels":semi,"orphanPixels":orphans,"visibleColors":colors.size(),"occupiedBounds":{"x":rect.position.x,"y":rect.position.y,"width":rect.size.x,"height":rect.size.y},"activeProjectUnchanged":global.get("current_project")==active}
	var file=FileAccess.open(output_dir.path_join("verification.json"),FileAccess.WRITE)
	file.store_string(JSON.stringify(report,"  ")+"\n")
	file.close()
	return report

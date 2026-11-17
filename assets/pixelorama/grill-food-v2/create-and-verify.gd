const W = 36
const H = 7

func box(picture,x,y,w,h,color):
	picture.fill_rect(Rect2i(x,y,w,h),Color(color))

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var global=root.get_node("Global")
	var active=global.get("current_project")
	var active_bytes=image.get_data().duplicate()
	var source_dir=str(params.source_dir)
	var output_dir=str(params.output_dir)
	var tag_script=null
	for candidate in global.get("projects"):
		if candidate.animation_tags.size()>0:
			tag_script=candidate.animation_tags[0].get_script()
			break
	if tag_script==null:
		return {"error":"No native tag prototype available"}
	var names=["01 - compact griddle shadows","02 - rounded raw meat contours","03 - rose and red meat body ramps","04 - meat sheen and fine marbling","05 - warm raw batter edge and body","06 - batter upper-left sheen and dimples"]
	var pictures=[]
	for index in range(names.size()):
		var pic=Image.create(W,H,false,Image.FORMAT_RGBA8)
		pic.fill(Color.TRANSPARENT)
		pictures.append(pic)
	for base in [0,12,24]:
		box(pictures[0],base+3,6,7,1,"#46404b")
	# One wide oblique patty, with a rounded five-row silhouette.
	for row in [[3,1,6],[1,2,10],[1,3,10],[2,4,8],[3,5,6]]:
		box(pictures[1],row[0],row[1],row[2],1,"#322c38")
	box(pictures[2],2,2,8,1,"#ee75a3")
	box(pictures[2],2,3,8,1,"#c94d7b")
	box(pictures[2],3,4,6,1,"#9f385e")
	box(pictures[3],3,2,4,1,"#ffacc9")
	box(pictures[3],8,2,1,1,"#ffd2de")
	box(pictures[3],3,3,1,1,"#ee75a3")
	box(pictures[3],6,3,1,1,"#ffacc9")
	box(pictures[3],8,4,1,1,"#c94d7b")
	# A longer shallow-curved plain link, distinct from the patty's broad face.
	for row in [[4,2,6],[1,3,10],[1,4,10],[2,5,7]]:
		box(pictures[1],12+row[0],row[1],row[2],1,"#322c38")
	box(pictures[1],12,4,1,1,"#322c38")
	box(pictures[2],14,3,8,1,"#d65362")
	box(pictures[2],14,4,7,1,"#c94d7b")
	box(pictures[3],15,3,4,1,"#ffacc9")
	box(pictures[3],19,3,2,1,"#ee75a3")
	box(pictures[3],15,4,4,1,"#9f385e")
	# Pale raw batter with a fuller oval and restrained dimples, never browned.
	for row in [[3,1,6],[1,2,10],[1,3,10],[2,4,8],[3,5,6]]:
		box(pictures[4],24+row[0],row[1],row[2],1,"#322c38")
	box(pictures[4],26,2,8,1,"#f1e5d1")
	box(pictures[4],26,3,8,1,"#f1e5d1")
	box(pictures[4],27,4,6,1,"#f1e5d1")
	box(pictures[5],27,2,5,1,"#fff5df")
	box(pictures[5],26,3,4,1,"#fff5df")
	box(pictures[5],28,2,1,1,"#f1e5d1")
	box(pictures[5],31,3,1,1,"#fff0d5")
	box(pictures[5],28,4,3,1,"#fff0d5")
	var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"refined-grill-food",Vector2i(W,H))
	var frame=load("res://src/Classes/Frame.gd").new()
	var complete=Image.create(W,H,false,Image.FORMAT_RGBA8)
	complete.fill(Color.TRANSPARENT)
	for index in range(names.size()):
		var layer=load("res://src/Classes/Layers/PixelLayer.gd").new(target,names[index])
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(pictures[index]))
		complete.blend_rect(pictures[index],Rect2i(0,0,W,H),Vector2i.ZERO)
	target.frames.append(frame)
	target.current_frame=0
	target.current_layer=0
	target.fps=1
	frame.duration=1.0
	var swatches=JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var allowed={}
	var palette=load("res://src/Palette/Palette.gd").new("Refined grill food - existing kitchen colors",7,3,"Existing21swatches")
	palette.is_project_palette=true
	for swatch in swatches.colors:
		palette.add_color(Color(str(swatch.hex)))
		allowed[Color(str(swatch.hex)).to_html()]=true
	target.palettes.clear()
	target.palettes["Refined grill food - existing kitchen colors"]=palette
	target.project_current_palette_name="Refined grill food - existing kitchen colors"
	target.animation_tags.append(tag_script.new("refined-grill-food-static",Color("#ee75a3"),1,1))
	var saved=root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("grill-food.pxo"),false,target)
	if not saved:
		return {"error":"Explicit native save failed"}
	complete.save_png(output_dir.path_join("grill-food-atlas.png"))
	var export_names=["patty","sausage","pancake"]
	var sprite_reports=[]
	for index in range(3):
		var crop=complete.get_region(Rect2i(index*12,0,12,7))
		crop.save_png(output_dir.path_join(export_names[index]+".png"))
		var used=crop.get_used_rect()
		sprite_reports.append({"id":export_names[index],"sourceRect":{"x":index*12,"y":0,"width":12,"height":7},"occupiedBounds":{"x":used.position.x,"y":used.position.y,"width":used.size.x,"height":used.size.y}})
	var preview=complete.duplicate()
	preview.resize(W*10,H*10,Image.INTERPOLATE_NEAREST)
	preview.save_png(source_dir.path_join("grill-food-preview.png"))
	preview.save_png(output_dir.path_join("grill-food-preview.png"))
	var zip=ZIPReader.new()
	if zip.open(source_dir.path_join("grill-food.pxo"))!=OK:
		return {"error":"Cannot reopen actual saved source"}
	var data=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened=Image.create(W,H,false,Image.FORMAT_RGBA8)
	reopened.fill(Color.TRANSPARENT)
	var cel_sizes=[]
	for index in range(names.size()):
		var bytes=zip.read_file("image_data/frames/1/layer_"+str(index+1))
		cel_sizes.append(bytes.size())
		if bytes.size()!=W*H*4:
			return {"error":"Wrong saved cel dimensions"}
		reopened.blend_rect(Image.create_from_data(W,H,false,Image.FORMAT_RGBA8,bytes),Rect2i(0,0,W,H),Vector2i.ZERO)
	zip.close()
	var opaque=0
	var semi=0
	var orphans=0
	var out_of_palette=0
	var colors={}
	for y in range(H):
		for x in range(W):
			var color=complete.get_pixel(x,y)
			if color.a==0:
				continue
			opaque+=1
			colors[color.to_html()]=true
			if color.a<1:
				semi+=1
			if not allowed.has(color.to_html()):
				out_of_palette+=1
			var neighbor=false
			for offset in [Vector2i.LEFT,Vector2i.RIGHT,Vector2i.UP,Vector2i.DOWN]:
				var p=Vector2i(x,y)+offset
				if p.x>=0 and p.x<W and p.y>=0 and p.y<H and complete.get_pixel(p.x,p.y).a>0:
					neighbor=true
			if not neighbor:
				orphans+=1
	var png=Image.load_from_file(output_dir.path_join("grill-food-atlas.png"))
	png.convert(Image.FORMAT_RGBA8)
	var crop_matches=true
	for index in range(3):
		var crop=Image.load_from_file(output_dir.path_join(export_names[index]+".png"))
		crop.convert(Image.FORMAT_RGBA8)
		crop_matches=crop_matches and crop.get_data()==reopened.get_region(Rect2i(index*12,0,12,7)).get_data()
	var report={"savedSourceMatchesPng":reopened.get_data()==png.get_data(),"independentSpritesMatchSavedCrops":crop_matches,"nativeSize":[data.size_x,data.size_y],"individualFrameSize":[12,7],"sourceLayers":data.layers.size(),"celByteSizes":cel_sizes,"paletteSwatches":swatches.colors.size(),"frames":data.frames.size(),"fps":data.fps,"tag":data.tags[0].name,"opaquePixels":opaque,"visibleColors":colors.size(),"semitransparentPixels":semi,"orphanPixels":orphans,"outOfPalettePixels":out_of_palette,"sprites":sprite_reports,"activeProjectUnchanged":global.get("current_project")==active,"boundImageUnchanged":image.get_data()==active_bytes}
	var file=FileAccess.open(output_dir.path_join("verification.json"),FileAccess.WRITE)
	file.store_string(JSON.stringify(report,"  ")+"\n")
	file.close()
	return report

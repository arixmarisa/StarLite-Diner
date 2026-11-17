func run(api, image, project, params):
	var root=Engine.get_main_loop().root
	var target=null
	var active_before=root.get_node("Global").get("current_project")
	for p in root.get_node("Global").get("projects"):
		if p.name=="kitchen-counter-kit" and p.size==Vector2i(160,160) and p.layers.size()==4:
			if target!=null: return {"error":"Ambiguous target"}
			target=p
	if target==null: return {"error":"Missing source target"}
	var zip=ZIPReader.new()
	if zip.open(str(params.source_dir).path_join("kitchen-counter-kit.pxo"))!=OK:
		return {"error":"Cannot read saved source"}
	var data=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var rebuilt=Image.create(160,160,false,Image.FORMAT_RGBA8)
	rebuilt.fill(Color(0,0,0,0))
	var layers=[]
	for i in range(4):
		var raw=zip.read_file("image_data/frames/1/layer_"+str(i+1))
		if raw.size()!=160*160*4: return {"error":"Wrong saved cel byte count","layer":i}
		var cel=Image.create_from_data(160,160,false,Image.FORMAT_RGBA8,raw)
		rebuilt.blend_rect(cel,Rect2i(0,0,160,160),Vector2i.ZERO)
		layers.append({"name":data.layers[i].name,"populated":cel.get_used_rect().size!=Vector2i.ZERO})
	zip.close()
	var atlas=Image.load_from_file(str(params.output_dir).path_join("kitchen-counter-atlas.png"))
	var top=Image.load_from_file(str(params.output_dir).path_join("steel-counter-top.png"))
	var vertical=Image.load_from_file(str(params.output_dir).path_join("steel-counter-vertical-top.png"))
	var end_left=Image.load_from_file(str(params.output_dir).path_join("steel-counter-end-left.png"))
	var end_right=Image.load_from_file(str(params.output_dir).path_join("steel-counter-end-right.png"))
	var corner_left=Image.load_from_file(str(params.output_dir).path_join("steel-counter-corner-left.png"))
	var corner_right=Image.load_from_file(str(params.output_dir).path_join("steel-counter-corner-right.png"))
	var side=Image.load_from_file(str(params.output_dir).path_join("steel-counter-side.png"))
	var fascia=Image.load_from_file(str(params.output_dir).path_join("steel-counter-near-fascia.png"))
	var seams=true
	for n in range(24):
		seams=seams and top.get_pixel(0,n)==top.get_pixel(15,n)
		seams=seams and end_left.get_pixel(15,n)==top.get_pixel(0,n)
		seams=seams and end_right.get_pixel(0,n)==top.get_pixel(15,n)
		seams=seams and corner_right.get_pixel(0,n)==top.get_pixel(0,n)
		seams=seams and corner_left.get_pixel(23,n)==top.get_pixel(15,n)
		seams=seams and corner_right.get_pixel(n,23)==vertical.get_pixel(n,0)
		seams=seams and corner_left.get_pixel(n,23)==vertical.get_pixel(n,0)
		seams=seams and vertical.get_pixel(n,0)==vertical.get_pixel(n,15)
		for y in range(32):
			seams=seams and side.get_pixel(n,y)==vertical.get_pixel(n,y%16)
		for y in range(16):
			seams=seams and side.get_pixel(n,y+32)==fascia.get_pixel(n,y)
	var modules_match=true
	var opaque=0
	var semitransparent=0
	var colors={}
	for item in params.modules:
		var area=Rect2i(int(item.rect[0]),int(item.rect[1]),int(item.rect[2]),int(item.rect[3]))
		var png=Image.load_from_file(str(params.output_dir).path_join(str(item.id)+".png"))
		modules_match=modules_match and rebuilt.get_region(area).get_data()==png.get_data()
		for y in range(png.get_height()):
			for x in range(png.get_width()):
				var color=png.get_pixel(x,y)
				if color.a>0:
					opaque+=1
					if color.a<1: semitransparent+=1
					colors[color.to_html()]=true
	var palette_data=JSON.parse_string(data.palettes[0].values()[0])
	return {"savedSourceMatchesAtlas":rebuilt.get_data()==atlas.get_data(),"all11ModuleExportsMatch":modules_match,"exactHRepeatVRepeatEndAndCornerSeams":seams,"layers":layers,"sourceSize":[data.size_x,data.size_y],"paletteSwatches":palette_data.colors.size(),"frames":data.frames.size(),"tag":data.tags[0].name,"opaqueModulePixels":opaque,"semitransparentPixels":semitransparent,"visibleColors":colors.size(),"activeProjectUnchanged":root.get_node("Global").get("current_project")==active_before}


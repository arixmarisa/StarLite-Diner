func run(api, image, project, params):
	var output_dir=str(params.output_dir)
	var holes=0
	var orphans=0
	for item in params.modules:
		var pic=Image.load_from_file(output_dir.path_join(str(item.id)+".png"))
		var w=pic.get_width()
		var h=pic.get_height()
		var visited={}
		var pending=[]
		for x in range(w):
			for y in [0,h-1]:
				if pic.get_pixel(x,y).a==0:
					pending.append(Vector2i(x,y))
		for y in range(h):
			for x in [0,w-1]:
				if pic.get_pixel(x,y).a==0:
					pending.append(Vector2i(x,y))
		while pending.size()>0:
			var point=pending.pop_back()
			if visited.has(point): continue
			visited[point]=true
			for step in [Vector2i.LEFT,Vector2i.RIGHT,Vector2i.UP,Vector2i.DOWN]:
				var next=point+step
				if next.x>=0 and next.y>=0 and next.x<w and next.y<h and pic.get_pixel(next.x,next.y).a==0 and not visited.has(next):
					pending.append(next)
		for y in range(h):
			for x in range(w):
				if pic.get_pixel(x,y).a==0:
					if not visited.has(Vector2i(x,y)): holes+=1
				else:
					var neighbors=0
					for dy in range(-1,2):
						for dx in range(-1,2):
							if dx==0 and dy==0: continue
							var nx=x+dx
							var ny=y+dy
							if nx>=0 and ny>=0 and nx<w and ny<h and pic.get_pixel(nx,ny).a>0:
								neighbors+=1
					if neighbors==0: orphans+=1
	var preview_zip=ZIPReader.new()
	if preview_zip.open(str(params.source_dir).path_join("kitchen-counter-preview.pxo"))!=OK: return {"error":"Missing preview source"}
	var data=JSON.parse_string(preview_zip.read_file("data.json").get_string_from_utf8())
	var rebuilt=Image.create(176,128,false,Image.FORMAT_RGBA8)
	rebuilt.fill(Color(0,0,0,0))
	for i in range(2):
		var raw=preview_zip.read_file("image_data/frames/1/layer_"+str(i+1))
		if raw.size()!=176*128*4: return {"error":"Wrong preview cel dimensions"}
		var cel=Image.create_from_data(176,128,false,Image.FORMAT_RGBA8,raw)
		rebuilt.blend_rect(cel,Rect2i(0,0,176,128),Vector2i.ZERO)
	preview_zip.close()
	var png=Image.load_from_file(output_dir.path_join("kitchen-counter-preview.png"))
	var palette=JSON.parse_string(data.palettes[0].values()[0])
	var top=Image.load_from_file(output_dir.path_join("steel-counter-top.png"))
	var face=Image.load_from_file(output_dir.path_join("steel-counter-front.png"))
	var left=Image.load_from_file(output_dir.path_join("steel-counter-end-left.png"))
	var right=Image.load_from_file(output_dir.path_join("steel-counter-end-right.png"))
	var full_ends=true
	for y in range(40):
		full_ends=full_ends and left.get_pixel(15,y)==(top.get_pixel(0,y) if y<24 else face.get_pixel(15,y-24))
		full_ends=full_ends and right.get_pixel(0,y)==(top.get_pixel(15,y) if y<24 else face.get_pixel(0,y-24))
	return {"transparentHolePixels":holes,"orphanPixels":orphans,"previewSavedCelsMatchNativePng":rebuilt.get_data()==png.get_data(),"previewLayers":data.layers.size(),"previewPaletteSwatches":palette.colors.size(),"full40RowEndJoinsMatch":full_ends}

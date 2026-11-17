func run(api,image,project,params):
	var out_dir=str(params.output_dir)
	var img=Image.load_from_file(out_dir.path_join("player-front.png"))
	var seen={}
	var queue=[]
	for x in range(16):
		for y in [0,23]:
			if img.get_pixel(x,y).a==0:
				queue.append(Vector2i(x,y))
	for y in range(24):
		for x in [0,15]:
			if img.get_pixel(x,y).a==0:
				queue.append(Vector2i(x,y))
	while queue.size()>0:
		var p=queue.pop_back()
		var key=str(p.x)+","+str(p.y)
		if seen.has(key):
			continue
		seen[key]=true
		for d in [Vector2i(-1,0),Vector2i(1,0),Vector2i(0,-1),Vector2i(0,1)]:
			var next=p+d
			if Rect2i(0,0,16,24).has_point(next) and img.get_pixelv(next).a==0 and not seen.has(str(next.x)+","+str(next.y)):
				queue.append(next)
	var holes=[]
	for y in range(24):
		for x in range(16):
			if img.get_pixel(x,y).a==0 and not seen.has(str(x)+","+str(y)):
				holes.append([x,y])
	var skin=Image.load_from_file(out_dir.path_join("skin-mask.png"))
	var outfit=Image.load_from_file(out_dir.path_join("outfit-mask.png"))
	var overlap=0
	for y in range(24):
		for x in range(16):
			if skin.get_pixel(x,y).a>0 and outfit.get_pixel(x,y).a>0:
				overlap+=1
	var original=Image.load_from_file(str(params.original)).get_region(Rect2i(0,0,16,24))
	var comparison=Image.load_from_file(out_dir.path_join("player-front-comparison.png"))
	var zip=ZIPReader.new()
	if zip.open(str(params.source_dir).path_join("player-front-comparison.pxo"))!=OK:
		return {"error":"Comparison source cannot reopen"}
	var data=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reconstructed=Image.create(48,32,false,Image.FORMAT_RGBA8)
	reconstructed.fill(Color(0,0,0,0))
	for i in range(1,3):
		var raw=zip.read_file("image_data/frames/1/layer_"+str(i))
		reconstructed.blend_rect(Image.create_from_data(48,32,false,Image.FORMAT_RGBA8,raw),Rect2i(0,0,48,32),Vector2i.ZERO)
	zip.close()
	return {"enclosedTransparentPixels":holes,"roleMaskOverlap":overlap,"groundAnchorPixelOpaque":img.get_pixel(8,23).a==1,"originalComparisonPixelsUnchanged":comparison.get_region(Rect2i(4,4,16,24)).get_data()==original.get_data(),"revisedComparisonPixelsMatch":comparison.get_region(Rect2i(28,4,16,24)).get_data()==img.get_data(),"savedComparisonMatchesPng":reconstructed.get_data()==comparison.get_data(),"comparisonFrames":data.frames.size(),"comparisonLayers":data.layers.size()}

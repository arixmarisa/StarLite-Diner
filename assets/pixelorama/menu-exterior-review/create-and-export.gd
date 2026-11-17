func blank(w=384,h=216):
	var out=Image.create(w,h,false,Image.FORMAT_RGBA8)
	out.fill(Color(0,0,0,0))
	return out

func rect(im,x,y,w,h,c):
	im.fill_rect(Rect2i(x,y,w,h),Color(c))

func poly(im,coords,c):
	var points=PackedVector2Array()
	var low=Vector2i(384,216)
	var high=Vector2i.ZERO
	for q in coords:
		points.append(Vector2(q[0],q[1]))
		low=low.min(Vector2i(q[0],q[1]))
		high=high.max(Vector2i(q[0],q[1]))
	for y in range(max(0,low.y),min(216,high.y+1)):
		for x in range(max(0,low.x),min(384,high.x+1)):
			if Geometry2D.is_point_in_polygon(Vector2(x+0.5,y+0.5),points):
				im.set_pixel(x,y,Color(c))

func line(im,x0,y0,x1,y1,c):
	var dx=absi(x1-x0)
	var sx=1 if x0<x1 else -1
	var dy=-absi(y1-y0)
	var sy=1 if y0<y1 else -1
	var err=dx+dy
	while true:
		if x0>=0 and x0<384 and y0>=0 and y0<216: im.set_pixel(x0,y0,Color(c))
		if x0==x1 and y0==y1: break
		var twice=2*err
		if twice>=dy: err+=dy; x0+=sx
		if twice<=dx: err+=dx; y0+=sy

func oval(im,x,y,w,h,c):
	for yy in range(y,y+h):
		for xx in range(x,x+w):
			var nx=(float(xx-x)+0.5)/float(w)*2.0-1.0
			var ny=(float(yy-y)+0.5)/float(h)*2.0-1.0
			if nx*nx+ny*ny<=1.0 and xx>=0 and xx<384 and yy>=0 and yy<216: im.set_pixel(xx,yy,Color(c))

func font():
	return {"S":["01111","10000","10000","01110","00001","00001","11110"],"T":["11111","00100","00100","00100","00100","00100","00100"],"A":["01110","10001","10001","11111","10001","10001","10001"],"R":["11110","10001","10001","11110","10100","10010","10001"],"L":["10000","10000","10000","10000","10000","10000","11111"],"I":["11111","00100","00100","00100","00100","00100","11111"],"E":["11111","10000","10000","11110","10000","10000","11111"],"D":["11110","10001","10001","10001","10001","10001","11110"],"N":["10001","11001","11001","10101","10011","10011","10001"]}

func letters(im,word,x,y,scale,halo,body,light):
	var glyphs=font()
	for n in range(word.length()):
		var glyph=glyphs[word[n]]
		for gy in range(7):
			for gx in range(5):
				if glyph[gy][gx]=="1": rect(im,x+n*6*scale+gx*scale-1,y+gy*scale-1,scale+2,scale+2,halo)
	for n in range(word.length()):
		var glyph=glyphs[word[n]]
		for gy in range(7):
			for gx in range(5):
				if glyph[gy][gx]=="1":
					rect(im,x+n*6*scale+gx*scale,y+gy*scale,scale,scale,body)
					if scale>1: rect(im,x+n*6*scale+gx*scale,y+gy*scale,1,1,light)

func composite(images):
	var out=blank()
	for im in images: out.blend_rect(im,Rect2i(0,0,384,216),Vector2i.ZERO)
	return out

func write_json(path,value):
	var file=FileAccess.open(path,FileAccess.WRITE)
	file.store_string(JSON.stringify(value,"  "))
	file.close()

func source(images,names,name,path,colors,tag):
	var project_script=load("res://src/Classes/Project.gd")
	var frame_script=load("res://src/Classes/Frame.gd")
	var layer_script=load("res://src/Classes/Layers/PixelLayer.gd")
	var target=project_script.new(Array([],TYPE_OBJECT,"RefCounted",frame_script),name,Vector2i(384,216))
	var frame=frame_script.new()
	frame.duration=1
	for i in range(images.size()):
		var layer=layer_script.new(target,str(names[i]))
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(images[i]))
	target.frames.append(frame)
	target.fps=1
	var pal=load("res://src/Palette/Palette.gd").new("Starlite exterior - rose chrome blue hour",8,5,"Original menu exterior palette")
	pal.is_project_palette=true
	for color in colors: pal.add_color(Color(color))
	target.palettes[pal.name]=pal
	target.project_current_palette_name=pal.name
	target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new(tag,Color("#ee75a3"),1,1))
	var root=Engine.get_main_loop().root
	if not root.get_node("OpenSave").call("save_pxo_file",path,false,target): return {"error":"Source save failed"}
	var zip=ZIPReader.new()
	if zip.open(path)!=OK: return {"error":"Source archive could not open"}
	var meta=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	if meta.size_x!=384 or meta.size_y!=216 or meta.frames.size()!=1 or meta.layers.size()!=names.size() or meta.tags.size()!=1 or meta.fps!=1 or meta.frames[0].duration!=1:
		zip.close(); return {"error":"Saved source metadata mismatch"}
	if meta.tags[0].name!=tag or meta.tags[0].from!=1 or meta.tags[0].to!=1:
		zip.close(); return {"error":"Saved source tag mismatch"}
	for i in range(names.size()):
		if meta.layers[i].name!=names[i]: zip.close(); return {"error":"Saved layer names mismatch"}
	var saved_palette=JSON.parse_string(str(meta.palettes[0].values()[0]))
	if saved_palette.colors.size()!=colors.size(): zip.close(); return {"error":"Saved palette count mismatch"}
	var rebuilt=blank()
	for i in range(images.size()):
		var raw=zip.read_file("image_data/frames/1/layer_"+str(i+1))
		if raw!=images[i].get_data(): zip.close(); return {"error":"Saved cel mismatch","layer":i}
		rebuilt.blend_rect(Image.create_from_data(384,216,false,Image.FORMAT_RGBA8,raw),Rect2i(0,0,384,216),Vector2i.ZERO)
	zip.close()
	if rebuilt.get_data()!=composite(images).get_data(): return {"error":"Source composite mismatch"}
	return {"saved":true,"width":384,"height":216,"layers":images.size(),"frames":1,"tags":1,"fps":1,"sourceCelsExact":images.size(),"sourceCompositeExact":true,"savedMetadataExact":true,"savedPaletteSwatches":saved_palette.colors.size()}

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var active=root.get_node("Global").get("current_project")
	var src=str(params.source_dir)
	var out=str(params.output_dir)
	var palette=["#322c38","#46404b","#676c70","#9ba8a5","#d5dfd3","#fff0d5","#9f385e","#c94d7b","#ee75a3","#ffacc9","#ffd2de","#a6bcb2","#f1e5d1","#fff5df","#1d2943","#263752","#324664","#485571","#53627a","#344457","#263c46","#324e52","#486061","#363a4b","#424658","#575b6a","#ad714b","#d69b62","#f3c886","#5f4c50","#806452","#b5845f","#4b5b50","#64705a","#673952","#ad5375"]
	var names=["01 - blue hour sky and clouds","02 - roadside trees and horizon","03 - parking forecourt and sidewalk","04 - diner structure chrome and shadows","05 - rose facade and checker base","06 - warm window interior hints","07 - glass doors mullions and reflections","08 - original rooftop neon and trim","09 - light pools glints and foreground accents"]
	var layers=[]
	for i in range(9): layers.append(blank())
	var im=layers[0]
	im.fill(Color("#263752"))
	rect(im,0,0,384,23,"#1d2943")
	rect(im,0,63,384,30,"#324664")
	rect(im,0,93,384,45,"#485571")
	poly(im,[[22,28],[35,25],[50,25],[60,28],[83,28],[94,31],[81,33],[39,33]],"#324664")
	rect(im,38,29,42,1,"#485571")
	poly(im,[[267,36],[280,32],[298,32],[311,35],[333,35],[343,38],[327,40],[282,40]],"#324664")
	line(im,289,36,326,36,"#485571")
	poly(im,[[72,49],[91,46],[107,47],[119,50],[108,52],[83,52]],"#324664")
	for q in [[23,17],[94,13],[273,18],[348,24]]: rect(im,q[0],q[1],1,1,"#53627a")
	im=layers[1]
	poly(im,[[0,109],[24,104],[49,107],[71,101],[106,108],[140,104],[183,110],[234,102],[272,108],[313,103],[353,108],[384,101],[384,146],[0,146]],"#344457")
	for t in [[12,76,28,35],[362,71,30,42],[6,97,22,27],[349,92,31,28]]:
		oval(im,t[0],t[1],t[2],t[3],"#263c46")
		oval(im,t[0]+2,t[1]+2,t[2]-6,t[3]-8,"#324e52")
		oval(im,t[0]+1,t[1]+7,t[2]-8,t[3]-16,"#486061")
	for x in [24,371]:
		rect(im,x,96,2,43,"#263c46")
		line(im,x,114,x-7,105,"#263c46")
		line(im,x+1,107,x+8,95,"#263c46")
	line(im,0,132,383,132,"#4b5b50")
	for x in range(0,384,9): rect(im,x,130,1,9,"#263c46")
	im=layers[2]
	rect(im,0,139,384,77,"#363a4b")
	poly(im,[[19,141],[363,141],[373,154],[10,154]],"#575b6a")
	line(im,10,153,373,153,"#676c70")
	line(im,10,154,373,154,"#322c38")
	for x in [42,86,130,253,297,341]: line(im,x,143,x+3,152,"#424658")
	poly(im,[[65,150],[109,150],[123,174],[50,174]],"#424658")
	poly(im,[[270,150],[316,150],[333,174],[254,174]],"#424658")
	line(im,54,176,25,207,"#575b6a")
	line(im,55,177,27,207,"#46404b")
	line(im,329,176,359,207,"#575b6a")
	line(im,328,177,357,207,"#46404b")
	line(im,15,208,89,208,"#575b6a")
	line(im,293,208,369,208,"#575b6a")
	for q in [[15,164,8],[33,194,11],[94,181,6],[119,201,12],[251,196,10],[341,163,7],[353,188,10],[184,204,15],[213,187,7]]:
		rect(im,q[0],q[1],q[2],1,"#424658")
	im=layers[3]
	poly(im,[[37,137],[347,137],[357,146],[27,146]],"#322c38")
	rect(im,40,85,305,55,"#322c38")
	rect(im,43,88,299,49,"#676c70")
	poly(im,[[33,78],[37,72],[47,68],[336,68],[347,72],[351,78],[351,89],[33,89]],"#322c38")
	poly(im,[[35,77],[40,73],[48,70],[335,70],[344,73],[349,78],[349,86],[35,86]],"#9ba8a5")
	poly(im,[[41,73],[49,71],[335,71],[343,74],[343,76],[40,76]],"#d5dfd3")
	rect(im,44,76,298,2,"#676c70")
	rect(im,35,85,314,2,"#46404b")
	rect(im,37,87,310,2,"#a6bcb2")
	rect(im,41,89,302,2,"#fff0d5")
	for x in [53,88,122,157,225,260,295,331]:
		rect(im,x,74,1,2,"#fff0d5")
		rect(im,x+1,75,1,1,"#46404b")
	for x in [106,265]:
		rect(im,x,62,13,6,"#46404b")
		rect(im,x+1,61,11,2,"#9ba8a5")
		rect(im,x+2,63,2,5,"#676c70")
		rect(im,x+7,63,4,2,"#676c70")
	for x in [44,171,210,339]:
		rect(im,x,90,4,47,"#46404b")
		rect(im,x,91,1,46,"#d5dfd3")
		rect(im,x+1,91,1,46,"#9ba8a5")
	rect(im,166,138,52,3,"#9ba8a5")
	rect(im,163,141,58,3,"#676c70")
	rect(im,160,144,64,2,"#46404b")
	line(im,166,138,217,138,"#d5dfd3")
	line(im,163,141,220,141,"#a6bcb2")
	im=layers[4]
	for side in [[48,122],[214,122]]:
		rect(im,side[0],side[1],123,15,"#9f385e")
		rect(im,side[0],side[1],123,2,"#ffacc9")
		rect(im,side[0]+1,side[1]+3,121,8,"#c94d7b")
		rect(im,side[0]+2,side[1]+3,119,2,"#ee75a3")
		for x in range(side[0]+7,side[0]+119,23):
			rect(im,x,side[1]+3,1,8,"#9f385e")
			rect(im,x+1,side[1]+3,1,7,"#ffacc9")
		for y in range(133,139,3):
			for x in range(side[0],side[0]+123,3):
				rect(im,x,y,min(3,side[0]+123-x),3,"#f1e5d1" if ((x-side[0])/3+(y-133)/3)%2==0 else "#322c38")
	for x in [48,214]:
		rect(im,x,91,123,3,"#9f385e")
		rect(im,x,91,123,1,"#ee75a3")
	im=layers[5]
	for x in [49,215]:
		rect(im,x,94,121,26,"#ad714b")
		rect(im,x+1,95,119,23,"#f3c886")
		rect(im,x+1,98,119,5,"#d69b62")
		rect(im,x+1,112,119,6,"#806452")
		for bx in [x+6,x+49,x+92]:
			rect(im,bx,108,21,8,"#5f4c50")
			rect(im,bx+1,108,19,2,"#9f385e")
			rect(im,bx+1,110,19,4,"#c94d7b")
			rect(im,bx+2,110,1,3,"#ee75a3")
		for tx in [x+21,x+65]:
			rect(im,tx,110,18,2,"#f1e5d1")
			rect(im,tx+8,112,2,6,"#676c70")
			rect(im,tx+5,117,8,1,"#46404b")
		for lx in [x+23,x+83]:
			rect(im,lx,95,1,5,"#5f4c50")
			poly(im,[[lx-4,100],[lx+5,100],[lx+7,103],[lx-6,103]],"#fff0d5")
			rect(im,lx-3,103,7,1,"#d69b62")
	im=layers[6]
	for x in [48,214]:
		rect(im,x,94,123,1,"#322c38")
		rect(im,x,119,123,2,"#322c38")
		rect(im,x,121,123,2,"#9ba8a5")
		line(im,x,121,x+122,121,"#d5dfd3")
		for mx in [x+39,x+80]:
			rect(im,mx,94,3,26,"#46404b")
			rect(im,mx,94,1,25,"#fff0d5")
		for rx in [x+9,x+48,x+88]:
			poly(im,[[rx,97],[rx+4,97],[rx-5,109],[rx-9,109]],"#b5845f")
			line(im,rx,97,rx-7,107,"#fff0d5")
			line(im,rx+9,106,rx+4,113,"#d69b62")
		rect(im,x+1,118,121,1,"#d69b62")
	rect(im,176,92,33,45,"#322c38")
	rect(im,178,94,29,41,"#9ba8a5")
	for x in [180,194]:
		rect(im,x,96,11,36,"#806452")
		rect(im,x,96,11,5,"#d69b62")
		rect(im,x,102,11,10,"#b5845f")
		line(im,x+1,98,x+6,98,"#f3c886")
		line(im,x+1,103,x+1,130,"#d5dfd3")
		rect(im,x,132,11,2,"#676c70")
	line(im,190,94,190,135,"#d5dfd3")
	line(im,192,94,192,135,"#46404b")
	rect(im,187,118,2,9,"#fff0d5")
	rect(im,195,118,2,9,"#fff0d5")
	rect(im,187,120,1,5,"#676c70")
	rect(im,195,120,1,5,"#676c70")
	line(im,181,117,186,121,"#a6bcb2")
	line(im,198,121,203,117,"#a6bcb2")
	rect(im,179,134,27,2,"#d5dfd3")
	rect(im,174,91,1,47,"#fff0d5")
	rect(im,208,92,1,44,"#9ba8a5")
	im=layers[7]
	for x in [157,227]:
		rect(im,x,62,2,8,"#46404b")
		rect(im,x,63,1,6,"#9ba8a5")
	letters(im,"STARLITE",145,43,2,"#673952","#ee75a3","#ffd2de")
	letters(im,"DINER",177,61,1,"#673952","#fff0d5","#fff0d5")
	poly(im,[[34,79],[41,77],[342,77],[350,79],[350,84],[34,84]],"#673952")
	rect(im,38,79,308,3,"#ee75a3")
	rect(im,42,79,301,1,"#ffd2de")
	rect(im,36,80,2,2,"#c94d7b")
	rect(im,346,80,3,2,"#c94d7b")
	rect(im,39,83,306,1,"#9f385e")
	im=layers[8]
	for x in [50,91,132,216,257,298]:
		rect(im,x,140,28,1,"#806452")
		rect(im,x+3,142,23,1,"#5f4c50")
		rect(im,x+7,145,16,1,"#5f4c50")
	for x in [65,278]:
		rect(im,x,157,29,1,"#5f4c50")
		rect(im,x+4,159,21,1,"#806452")
		rect(im,x+8,162,18,1,"#5f4c50")
	line(im,43,91,43,133,"#d5dfd3")
	line(im,341,91,341,133,"#9ba8a5")
	for x in [42,345]:
		rect(im,x,86,1,2,"#fff5df")
	for x in [16,355]:
		rect(im,x,140,12,1,"#486061")
		rect(im,x+2,139,7,1,"#64705a")
	var bg=composite(layers)
	var button=Image.load_from_file(str(params.start_png))
	if button.get_size()!=Vector2i(96,28): return {"error":"Start must remain96x28"}
	var button_layer=blank()
	button_layer.blit_rect(button,Rect2i(0,0,96,28),Vector2i(144,148))
	if button_layer.get_region(Rect2i(144,148,96,28)).get_data()!=button.get_data(): return {"error":"Button placement changed pixels"}
	var bg_report=source(layers,names,"menu-exterior-review",src.path_join("menu-exterior.pxo"),palette,"menu-exterior-static")
	if bg_report.has("error"): return bg_report
	var review_report=source([bg,button_layer],["01 - original exterior background","02 - unchanged Start button review overlay"],"menu-exterior-start-preview",src.path_join("start-comparison.pxo"),palette,"menu-exterior-start-static")
	if review_report.has("error"): return review_report
	var review=composite([bg,button_layer])
	var codes={}
	for item in [[bg,"menu-exterior"],[review,"start-comparison"]]:
		codes[item[1]]=item[0].save_png(out.path_join(item[1]+".png"))
		var loaded=Image.load_from_file(out.path_join(item[1]+".png"))
		if loaded.get_data()!=item[0].get_data(): return {"error":"PNG roundtrip failed"}
		var preview=item[0].duplicate()
		preview.resize(1152,648,Image.INTERPOLATE_NEAREST)
		preview.save_png(out.path_join(item[1]+"-preview.png"))
		preview.save_png(src.path_join(item[1]+"-preview.png"))
	var colors={}
	var translucent=0
	var transparent=0
	for y in range(216):
		for x in range(384):
			var c=bg.get_pixel(x,y)
			colors[c.to_html(false)]=true
			if c.a>0 and not palette.has("#"+c.to_html(false)): return {"error":"Visible pixel outside declared palette"}
			if c.a==0: transparent+=1
			elif c.a!=1: translucent+=1
	var report={"background":bg_report,"startReview":review_report,"nativeSize":[384,216],"previewScale":3,"paletteSwatches":palette.size(),"visibleBackgroundColors":colors.size(),"semiTransparentPixels":translucent,"transparentBackgroundPixels":transparent,"startPixelsExact":true,"startPosition":{"x":144,"y":148,"width":96,"height":28},"gameIntegration":false,"activeProjectUnchanged":root.get_node("Global").get("current_project")==active,"pngRoundtripsExact":true,"exportCodes":codes}
	write_json(src.path_join("verification.json"),report)
	write_json(src.path_join("palette.json"),{"name":"Starlite exterior blue hour","colors":palette,"swatches":palette.size()})
	return report

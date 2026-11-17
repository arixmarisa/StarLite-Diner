func blank(w,h):
	var im=Image.create(w,h,false,Image.FORMAT_RGBA8)
	im.fill(Color(0,0,0,0))
	return im

func rect(im,x,y,w,h,c):
	if w>0 and h>0: im.fill_rect(Rect2i(x,y,w,h),Color(c))

func poly(im,coords,c):
	var points=PackedVector2Array()
	var low=Vector2i(im.get_width(),im.get_height())
	var high=Vector2i.ZERO
	for p in coords:
		points.append(Vector2(p[0],p[1]))
		low=low.min(Vector2i(p[0],p[1]))
		high=high.max(Vector2i(p[0],p[1]))
	for y in range(max(0,low.y),min(im.get_height(),high.y+1)):
		for x in range(max(0,low.x),min(im.get_width(),high.x+1)):
			if Geometry2D.is_point_in_polygon(Vector2(x+0.5,y+0.5),points):im.set_pixel(x,y,Color(c))

func line(im,x0,y0,x1,y1,c):
	var dx=absi(x1-x0)
	var sx=1 if x0<x1 else -1
	var dy=-absi(y1-y0)
	var sy=1 if y0<y1 else -1
	var err=dx+dy
	while true:
		if x0>=0 and x0<im.get_width() and y0>=0 and y0<im.get_height():im.set_pixel(x0,y0,Color(c))
		if x0==x1 and y0==y1:break
		var e=2*err
		if e>=dy:err+=dy;x0+=sx
		if e<=dx:err+=dx;y0+=sy

func blend(images):
	var size=images[0].get_size()
	var out=blank(size.x,size.y)
	for im in images:out.blend_rect(im,Rect2i(Vector2i.ZERO,size),Vector2i.ZERO)
	return out

func write_json(path,data):
	var f=FileAccess.open(path,FileAccess.WRITE)
	f.store_string(JSON.stringify(data,"  "))
	f.close()

func private_source(frames,names,title,path,palette,fps,tags):
	var root=Engine.get_main_loop().root
	var frame_script=load("res://src/Classes/Frame.gd")
	var size=frames[0][0].get_size()
	var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",frame_script),title,size)
	for name in names:target.layers.append(load("res://src/Classes/Layers/PixelLayer.gd").new(target,str(name)))
	var composites=[]
	for images in frames:
		var f=frame_script.new()
		f.duration=1
		for li in range(names.size()):f.cels.append(target.layers[li].new_cel_from_image(images[li]))
		target.frames.append(f)
		composites.append(blend(images))
	target.fps=fps
	for tag in tags:target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new(tag.name,Color("#ee75a3"),tag.from,tag.to))
	var pal=load("res://src/Palette/Palette.gd").new("Starlite animated exterior - original palette",8,5,"Approved static36swatches unchanged")
	pal.is_project_palette=true
	for c in palette:pal.add_color(Color(c))
	target.palettes[pal.name]=pal
	target.project_current_palette_name=pal.name
	if not root.get_node("OpenSave").call("save_pxo_file",path,false,target):return {"error":"Native source save failed","path":path}
	var zip=ZIPReader.new()
	if zip.open(path)!=OK:return {"error":"Cannot decode saved project"}
	var md=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	if md.size_x!=size.x or md.size_y!=size.y or md.layers.size()!=names.size() or md.frames.size()!=frames.size() or md.tags.size()!=tags.size() or md.fps!=fps:
		zip.close();return {"error":"Saved project metadata mismatch"}
	for li in range(names.size()):
		if md.layers[li].name!=names[li]:zip.close();return {"error":"Saved layer name mismatch"}
	for ti in range(tags.size()):
		if md.tags[ti].name!=tags[ti].name or md.tags[ti].from!=tags[ti].from or md.tags[ti].to!=tags[ti].to:
			zip.close();return {"error":"Saved tag mismatch"}
	var saved_pal=JSON.parse_string(str(md.palettes[0].values()[0]))
	if saved_pal.colors.size()!=palette.size():zip.close();return {"error":"Saved palette mismatch"}
	var cel_count=0
	for fi in range(frames.size()):
		if md.frames[fi].duration!=1:zip.close();return {"error":"Saved timing mismatch"}
		var rebuilt=blank(size.x,size.y)
		for li in range(names.size()):
			var data=zip.read_file("image_data/frames/"+str(fi+1)+"/layer_"+str(li+1))
			if data!=frames[fi][li].get_data():zip.close();return {"error":"Saved cel mismatch","frame":fi,"layer":li}
			rebuilt.blend_rect(Image.create_from_data(size.x,size.y,false,Image.FORMAT_RGBA8,data),Rect2i(Vector2i.ZERO,size),Vector2i.ZERO)
			cel_count+=1
		if rebuilt.get_data()!=composites[fi].get_data():zip.close();return {"error":"Saved composite mismatch"}
	zip.close()
	return {"composites":composites,"report":{"nativeSize":[size.x,size.y],"frames":frames.size(),"layers":names.size(),"tags":tags.size(),"fps":fps,"paletteSwatches":palette.size(),"savedCelsExact":cel_count,"savedMetadataExact":true,"savedCompositesExact":true}}

func sheet(images):
	var size=images[0].get_size()
	var out=blank(size.x*images.size(),size.y)
	for i in range(images.size()):out.blit_rect(images[i],Rect2i(Vector2i.ZERO,size),Vector2i(i*size.x,0))
	return out

func save_png(im,path):
	if im.save_png(path)!=OK:return false
	return Image.load_from_file(path).get_data()==im.get_data()

func frame_rect(x,y,w,h,duration=1000):
	return {"x":x,"y":y,"width":w,"height":h,"durationMs":duration}

func in_regions(x,y,regions):
	for r in regions:
		if Rect2i(r.x,r.y,r.width,r.height).has_point(Vector2i(x,y)):return true
	return false

func assert_palette(im,palette,opaque):
	for y in range(im.get_height()):
		for x in range(im.get_width()):
			var c=im.get_pixel(x,y)
			if opaque and c.a!=1:return false
			if c.a>0 and (c.a!=1 or not palette.has("#"+c.to_html(false))):return false
	return true

func projected(points,mirror):
	if not mirror:return points
	var out=[]
	for p in points:out.append([37-p[0],p[1]])
	return out

func leaf(im,w,d,mirror):
	poly(im,projected([[5,3],[5+w,3+d],[5+w,42-d],[5,42]],mirror),"#46404b")
	if w>=4:
		poly(im,projected([[6,4],[4+w,4+d],[4+w,41-d],[6,41]],mirror),"#9ba8a5")
		poly(im,projected([[7,6],[3+w,6+d],[3+w,38-d],[7,39]],mirror),"#5f4c50" if mirror else "#806452")
		var a=37-7 if mirror else 7
		var b=37-(3+w) if mirror else 3+w
		line(im,a,8,b,8+d,"#ad714b" if mirror else "#d69b62")
	var hinge=32 if mirror else 5
	line(im,hinge,4,hinge,41,"#9ba8a5" if mirror else "#d5dfd3")
	if w>=3:
		var edge=37-(5+w) if mirror else 5+w
		line(im,edge,4+d,edge,41-d,"#9ba8a5")

func at_time(sequence,time):
	var t=0
	for item in sequence:
		if time<t+int(item.durationMs):return int(item.frame)
		t+=int(item.durationMs)
	return int(sequence[-1].frame)

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var active=root.get_node("Global").get("current_project")
	var src=str(params.source_dir)
	var out=str(params.output_dir)
	var old=str(params.original_dir)
	var base=Image.load_from_file(out.path_join("menu-exterior.png"))
	var previous=Image.load_from_file(old.path_join("menu-exterior.png"))
	var palette=JSON.parse_string(FileAccess.get_file_as_string(src.path_join("palette.json"))).colors
	var tree_regions=[{"x":0,"y":70,"width":48,"height":70},{"x":344,"y":66,"width":40,"height":74}]
	var tree_changes=0
	for y in range(216):
		for x in range(384):
			if base.get_pixel(x,y)!=previous.get_pixel(x,y):
				if not in_regions(x,y,tree_regions):return {"error":"Base changed outside tree regions","pixel":[x,y]}
				tree_changes+=1
	if tree_changes==0:return {"error":"Expected foliage occlusion fix"}
	var zip=ZIPReader.new()
	zip.open(src.path_join("menu-exterior.pxo"))
	var base_layers=[]
	for li in range(9):base_layers.append(Image.create_from_data(384,216,false,Image.FORMAT_RGBA8,zip.read_file("image_data/frames/1/layer_"+str(li+1))))
	zip.close()
	var signs=[]
	var sign_images=[]
	var reports={}
	for definition in [{"id":"starlite","rect":{"x":144,"y":42,"width":96,"height":16},"sequence":[{"frame":0,"durationMs":2400},{"frame":1,"durationMs":180},{"frame":0,"durationMs":2820},{"frame":2,"durationMs":140},{"frame":1,"durationMs":160},{"frame":0,"durationMs":6300}]},{"id":"diner","rect":{"x":176,"y":60,"width":31,"height":9},"sequence":[{"frame":0,"durationMs":3600},{"frame":1,"durationMs":220},{"frame":0,"durationMs":4280},{"frame":2,"durationMs":180},{"frame":0,"durationMs":3720}]}]:
		var r=definition.rect
		var box=Rect2i(r.x,r.y,r.width,r.height)
		var stripped=[]
		for layer in base_layers:stripped.append(layer.duplicate())
		stripped[7].fill_rect(box,Color(0,0,0,0))
		var underlay=blend(stripped).get_region(box)
		var lit=base_layers[7].get_region(box)
		var dim=lit.duplicate()
		for y in range(r.height):
			for x in range(r.width):
				var c=dim.get_pixel(x,y)
				if c.a==0:continue
				var mapped="#322c38"
				if definition.id=="starlite":
					if c==Color("#ee75a3"):mapped="#9f385e"
					elif c==Color("#ffd2de"):mapped="#c94d7b"
				elif c==Color("#fff0d5"):mapped="#ad714b"
				dim.set_pixel(x,y,Color(mapped))
		var states=[[underlay,lit],[underlay,dim],[underlay,blank(r.width,r.height)]]
		var tags=[]
		for i in range(3):tags.append({"name":definition.id+"-"+["lit","dim","off"][i],"from":i+1,"to":i+1})
		var saved=private_source(states,["01 - opaque original background underlay","02 - neon word lit dim off"],definition.id+"-neon-states",src.path_join(definition.id+"-sign.pxo"),palette,1,tags)
		if saved.has("error"):return saved
		var images=saved.composites
		if images[0].get_data()!=base.get_region(box).get_data():return {"error":"Lit sign does not match base"}
		for state in images:
			if not assert_palette(state,palette,true):return {"error":"Sign patch alpha/palette failure"}
		var filename=definition.id+"-sign.png"
		if not save_png(sheet(images),out.path_join(filename)):return {"error":"Sign sheet roundtrip failed"}
		reports[definition.id]=saved.report
		var frames=[]
		for i in range(3):frames.append(frame_rect(i*r.width,0,r.width,r.height))
		signs.append({"id":definition.id,"image":filename,"rect":r,"states":["lit","dim","off"],"frames":frames,"sequence":definition.sequence,"periodMs":12000,"patchOpaque":true,"source":"assets/pixelorama/menu-exterior-animated-review/"+definition.id+"-sign.pxo"})
		sign_images.append(images)
	var door_rect={"x":174,"y":91,"width":36,"height":47}
	var closed=base.get_region(Rect2i(174,91,36,47))
	var aperture=closed.duplicate()
	rect(aperture,5,3,28,40,"#5f4c50")
	rect(aperture,8,5,22,25,"#806452")
	rect(aperture,9,8,20,3,"#ad714b")
	rect(aperture,10,11,18,1,"#d69b62")
	rect(aperture,14,14,10,14,"#ad714b")
	rect(aperture,7,31,24,10,"#5f4c50")
	line(aperture,6,42,13,33,"#ad714b")
	line(aperture,31,42,26,33,"#ad714b")
	rect(aperture,6,41,26,2,"#46404b")
	var door_frames=[]
	for fi in range(6):
		var panels=blank(36,47)
		var hardware=blank(36,47)
		if fi==0:
			panels.blit_rect(closed,Rect2i(5,3,28,40),Vector2i(5,3))
			rect(panels,13,27,2,9,"#806452")
			rect(panels,21,27,1,9,"#d5dfd3")
			rect(panels,22,27,1,9,"#806452")
			for x in [13,21]:hardware.blit_rect(closed,Rect2i(x,27,2,9),Vector2i(x,27))
		else:
			var w=[13,11,8,5,2,1][fi]
			var d=fi
			leaf(panels,w,d,false)
			leaf(panels,w,d,true)
			if w>=3:
				var hx=5+w-2
				rect(hardware,hx,26,1,7,"#fff0d5")
				rect(hardware,37-hx,26,1,7,"#d5dfd3")
				rect(hardware,hx,29,1,3,"#676c70")
				rect(hardware,37-hx,29,1,3,"#676c70")
		door_frames.append([aperture,panels,hardware])
	var saved_door=private_source(door_frames,["01 - fixed original frame and warm interior aperture","02 - authored inward opening door leaves","03 - projected handles and hardware"],"diner-door-opening",src.path_join("door-opening.pxo"),palette,8,[{"name":"door-opening","from":1,"to":6}])
	if saved_door.has("error"):return saved_door
	var doors=saved_door.composites
	if doors[0].get_data()!=closed.get_data():return {"error":"Closed door first frame changed"}
	for door in doors:
		if not assert_palette(door,palette,true):return {"error":"Door patch opacity/palette failed"}
		for y in range(47):
			for x in range(36):
				if not Rect2i(5,3,28,40).has_point(Vector2i(x,y)) and door.get_pixel(x,y)!=closed.get_pixel(x,y):return {"error":"Fixed door surround changed"}
	if not save_png(sheet(doors),out.path_join("door-opening.png")):return {"error":"Door sheet roundtrip failed"}
	var door_records=[]
	for i in range(6):door_records.append(frame_rect(i*36,0,36,47,125))
	var door_meta={"image":"door-opening.png","rect":door_rect,"frames":door_records,"durationMs":750,"fps":8,"trigger":"start","holdLast":true,"loop":false,"patchOpaque":true,"source":"assets/pixelorama/menu-exterior-animated-review/door-opening.pxo"}
	var apng_script=GDScript.new()
	apng_script.source_code=FileAccess.get_file_as_string(src.path_join("apng-helpers.gd"))
	if apng_script.reload()!=OK:return {"error":"APNG helper failed"}
	var writer=apng_script.new()
	var start=Image.load_from_file(str(params.start_png))
	var flicker_frames=[]
	var enlarged_flicker=[]
	var flicker_delays=[]
	var events=[0,2400,2580,3600,3820,5400,5540,5700,8100,8280,12000]
	for i in range(events.size()-1):
		var full=base.duplicate()
		for si in range(2):
			var state=at_time(signs[si].sequence,events[i])
			var r=signs[si].rect
			full.blit_rect(sign_images[si][state],Rect2i(0,0,r.width,r.height),Vector2i(r.x,r.y))
		for y in range(216):
			for x in range(384):
				if full.get_pixel(x,y)!=base.get_pixel(x,y) and not in_regions(x,y,[signs[0].rect,signs[1].rect]):return {"error":"Flicker changed unrelated pixels"}
		flicker_frames.append(full)
		var preview=full.duplicate()
		preview.blend_rect(start,Rect2i(0,0,96,28),Vector2i(144,148))
		preview.resize(1152,648,Image.INTERPOLATE_NEAREST)
		enlarged_flicker.append(preview)
		flicker_delays.append(events[i+1]-events[i])
	var opening_full=[]
	var opening_large=[]
	for door in doors:
		var full=base.duplicate()
		full.blit_rect(door,Rect2i(0,0,36,47),Vector2i(174,91))
		for y in range(216):
			for x in range(384):
				if full.get_pixel(x,y)!=base.get_pixel(x,y) and not in_regions(x,y,[door_rect]):return {"error":"Door changed unrelated pixels"}
		opening_full.append(full)
		var preview=full.duplicate()
		preview.blend_rect(start,Rect2i(0,0,96,28),Vector2i(144,148))
		preview.resize(1152,648,Image.INTERPOLATE_NEAREST)
		opening_large.append(preview)
	var apng_reports={}
	apng_reports.flicker=writer.save_apng(flicker_frames,out.path_join("idle-flicker.png"),flicker_delays,0)
	apng_reports.flickerPreview=writer.save_apng(enlarged_flicker,out.path_join("idle-flicker-preview.png"),flicker_delays,0)
	apng_reports.door=writer.save_apng(opening_full,out.path_join("door-opening-scene.png"),[125,125,125,125,125,125],1)
	apng_reports.doorPreview=writer.save_apng(opening_large,out.path_join("door-opening-preview.png"),[125,125,125,125,125,125],1)
	for name in ["idle-flicker-preview.png","door-opening-preview.png"]:
		var bytes=FileAccess.get_file_as_bytes(out.path_join(name))
		var f=FileAccess.open(src.path_join(name),FileAccess.WRITE)
		f.store_buffer(bytes)
		f.close()
	var contact=sheet(doors)
	contact.resize(648,141,Image.INTERPOLATE_NEAREST)
	contact.save_png(out.path_join("door-frames-preview.png"))
	contact.save_png(src.path_join("door-frames-preview.png"))
	var manifest={"schemaVersion":1,"status":"approved-integrated","integrated":true,"gameplayConnection":true,"frameIndexBase":0,"nativeTagIndexBase":1,"previewPage":"preview.html","nativeSize":{"width":384,"height":216},"palette":"assets/pixelorama/menu-exterior-animated-review/palette.json","background":"menu-exterior.png","signs":signs,"door":door_meta,"startOverlay":{"image":"/art/menu-v1/start-rest.png","rect":{"x":144,"y":148,"width":96,"height":28},"bakedIntoBackground":false},"treeCorrection":{"allowedRegions":tree_regions,"changedPixels":tree_changes,"outsideRegionsExact":true},"previews":{"closed":"start-comparison-preview.png","idle":"idle-flicker-preview.png","door":"door-opening-preview.png","doorContactSheet":"door-frames-preview.png"},"integration":"Approved home-menu playback; both signs flicker and Start opens the doors before mounting the existing diner. Standalone preview remains isolated."}
	write_json(out.path_join("manifest.json"),manifest)
	write_json(src.path_join("manifest.json"),manifest)
	var base_report=JSON.parse_string(FileAccess.get_file_as_string(src.path_join("verification.json")))
	var report={"base":base_report,"treeChangedPixels":tree_changes,"outsideTreeRegionsExact":true,"signs":reports,"door":saved_door.report,"closedDoorFirstFrameExact":true,"fixedDoorSurroundExact":true,"opaquePatchStates":true,"paletteSwatches":36,"allPatchPixelsInOriginalPalette":true,"animationChangesRestrictedToROIs":true,"apng":apng_reports,"activeProjectUnchanged":root.get_node("Global").get("current_project")==active,"integrated":false}
	write_json(src.path_join("animation-verification.json"),report)
	return report

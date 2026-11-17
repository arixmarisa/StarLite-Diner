const SIZE = Vector2i(160,160)
const NAMES = ["01 - steel worktop planes","02 - steel cabinet faces and low plinths","03 - chrome edges and plum contours","04 - recessed handles and rose accents"]

func blank(w,h):
	var pic = Image.create(w,h,false,Image.FORMAT_RGBA8)
	pic.fill(Color(0,0,0,0))
	return pic

func composite(layers,w,h):
	var output = blank(w,h)
	for layer in layers:
		output.blend_rect(layer,Rect2i(0,0,w,h),Vector2i.ZERO)
	return output

func box(pic,x,y,w,h,color):
	pic.fill_rect(Rect2i(x,y,w,h),Color(color))

func write_json(path,value):
	var file = FileAccess.open(path,FileAccess.WRITE)
	file.store_string(JSON.stringify(value,"  ")+"\n")
	file.close()

func run(api,image,project,params):
	var root = Engine.get_main_loop().root
	var global = root.get_node("Global")
	var active_before = global.get("current_project")
	var source_dir = str(params.source_dir)
	var output_dir = str(params.output_dir)
	var art_root = str(params.art_root)
	var repo = str(params.repo)
	var tag_script = null
	for item in global.get("projects"):
		if item.animation_tags.size()>0:
			tag_script = item.animation_tags[0].get_script()
			break
	if tag_script==null:
		return {"error":"No native static-tag prototype available"}
	var zip = ZIPReader.new()
	if zip.open(repo.path_join("assets/pixelorama/kitchen-counter-scale-review/kitchen-counter.pxo"))!=OK:
		return {"error":"Accepted counter source unavailable"}
	var accepted_roles=[]
	var accepted_contact=Image.create_from_data(64,32,false,Image.FORMAT_RGBA8,zip.read_file("image_data/frames/1/layer_1"))
	for index in range(2,6):
		var raw = zip.read_file("image_data/frames/1/layer_"+str(index))
		if raw.size()!=64*32*4:
			return {"error":"Accepted source has unexpected cel geometry"}
		accepted_roles.append(Image.create_from_data(64,32,false,Image.FORMAT_RGBA8,raw))
	zip.close()
	var pieces={}
	for spec in [["steel-counter-top",Rect2i(16,0,16,18)],["steel-counter-front",Rect2i(16,18,16,13)],["steel-counter-end-left",Rect2i(0,0,16,31)],["steel-counter-end-right",Rect2i(48,0,16,31)]]:
		var roles=[]
		for role in accepted_roles:
			roles.append(role.get_region(spec[1]))
		var base=accepted_contact.get_region(spec[1])
		base.blend_rect(roles[1],Rect2i(Vector2i.ZERO,roles[1].get_size()),Vector2i.ZERO)
		roles[1]=base
		pieces[spec[0]]=roles
	var vertical=[]
	var near=[]
	for n in range(4):
		vertical.append(blank(20,16))
		near.append(blank(20,13))
	box(vertical[0],0,0,20,16,"#9ba8a5")
	for spec in [[0,"#322c38"],[1,"#d5dfd3"],[17,"#d5dfd3"],[18,"#676c70"],[19,"#322c38"]]:
		box(vertical[2],spec[0],0,1,16,spec[1])
	box(near[1],0,0,20,10,"#322c38")
	box(near[1],1,1,18,8,"#9ba8a5")
	box(near[1],0,10,20,1,"#676c70")
	box(near[1],1,11,18,1,"#46404b")
	box(near[1],2,12,16,1,"#322c38")
	box(near[2],1,7,18,1,"#d5dfd3")
	box(near[2],1,8,18,1,"#676c70")
	box(near[3],7,2,7,2,"#676c70")
	box(near[3],7,2,6,1,"#d5dfd3")
	box(near[3],16,2,2,1,"#ee75a3")
	pieces["steel-counter-vertical-top"]=vertical
	pieces["steel-counter-near-fascia"]=near
	var h = composite(pieces["steel-counter-top"],16,18)
	var v = composite(vertical,20,16)
	for direction in ["left","right"]:
		var corner=[]
		for n in range(4):
			corner.append(blank(20,18))
		for yy in range(18):
			for xx in range(20):
				var use_h = xx*17>=yy*19 if direction=="left" else xx*17+yy*19<=323
				var color = h.get_pixel(8,yy) if use_h else v.get_pixel(xx,8)
				var role = 0 if color.to_html(false)=="9ba8a5" else 2
				corner[role].set_pixel(xx,yy,color)
		pieces["steel-counter-corner-"+direction]=corner
	var side=[]
	for n in range(4):
		var pic=blank(20,45)
		pic.blend_rect(vertical[n],Rect2i(0,0,20,16),Vector2i.ZERO)
		pic.blend_rect(vertical[n],Rect2i(0,0,20,16),Vector2i(0,16))
		pic.blend_rect(near[n],Rect2i(0,0,20,13),Vector2i(0,32))
		side.append(pic)
	pieces["steel-counter-side"]=side
	var lip_front=[]
	var lip_side=[]
	for n in range(4):
		lip_front.append(pieces["steel-counter-front"][n].get_region(Rect2i(0,0,16,3)))
		lip_side.append(vertical[n].get_region(Rect2i(17,0,3,16)))
	pieces["steel-counter-lip-front"]=lip_front
	pieces["steel-counter-lip-side"]=lip_side
	var specs=[
		["steel-counter-top",8,8,16,18],["steel-counter-front",32,8,16,13],
		["steel-counter-vertical-top",56,8,20,16],["steel-counter-near-fascia",88,8,20,13],
		["steel-counter-end-left",8,40,16,31],["steel-counter-end-right",32,40,16,31],
		["steel-counter-corner-left",64,40,20,18],["steel-counter-corner-right",104,40,20,18],
		["steel-counter-side",8,88,20,45],["steel-counter-lip-front",56,88,16,3],["steel-counter-lip-side",88,88,3,16]
	]
	var atlas_roles=[]
	for n in range(4):
		atlas_roles.append(blank(SIZE.x,SIZE.y))
	var exports={}
	var modules=[]
	for item in specs:
		var id=str(item[0])
		var rect=Rect2i(item[1],item[2],item[3],item[4])
		for n in range(4):
			atlas_roles[n].blend_rect(pieces[id][n],Rect2i(0,0,rect.size.x,rect.size.y),rect.position)
		exports[id]=composite(pieces[id],rect.size.x,rect.size.y)
		modules.append({"id":id,"image":id+".png","rect":[rect.position.x,rect.position.y,rect.size.x,rect.size.y],"frameSize":{"width":rect.size.x,"height":rect.size.y}})
	var join_errors=[]
	for yy in range(18):
		if exports["steel-counter-corner-right"].get_pixel(0,yy)!=h.get_pixel(0,yy):join_errors.append("right corner west "+str(yy))
		if exports["steel-counter-corner-left"].get_pixel(19,yy)!=h.get_pixel(15,yy):join_errors.append("left corner east "+str(yy))
		if h.get_pixel(0,yy)!=h.get_pixel(15,yy):join_errors.append("horizontal repeat "+str(yy))
	for xx in range(20):
		for direction in ["left","right"]:
			if exports["steel-counter-corner-"+direction].get_pixel(xx,17)!=v.get_pixel(xx,0):join_errors.append(direction+" corner south "+str(xx))
		if v.get_pixel(xx,0)!=v.get_pixel(xx,15):join_errors.append("vertical repeat "+str(xx))
	var grill = Image.load_from_file(art_root.path_join("kitchen-grill-scale-review/kitchen-grill.png"))
	var front = exports["steel-counter-front"]
	for yy in range(31):
		var expected = h.get_pixel(0,yy) if yy<18 else front.get_pixel(0,yy-18)
		if grill.get_pixel(95,5+yy)!=expected:join_errors.append("accepted grill "+str(yy))
	if join_errors.size()>0:return {"error":"Native seam validation failed","details":join_errors}
	var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"kitchen-counter-v3",SIZE)
	var frame=load("res://src/Classes/Frame.gd").new()
	for n in range(4):
		var layer=load("res://src/Classes/Layers/PixelLayer.gd").new(target,NAMES[n])
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(atlas_roles[n]))
	target.frames.append(frame)
	target.fps=1
	target.current_frame=0
	target.current_layer=0
	frame.duration=1.0
	var palette_data=JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var palette=load("res://src/Palette/Palette.gd").new("Compact kitchen steel",7,2,"Accepted14-swatch steel rose chrome palette")
	palette.is_project_palette=true
	for swatch in palette_data.colors:palette.add_color(Color(str(swatch.hex)))
	target.palettes.clear()
	target.palettes["Compact kitchen steel"]=palette
	target.project_current_palette_name="Compact kitchen steel"
	target.animation_tags.append(tag_script.new("kitchen-counter-v3-static",Color("#ee75a3"),1,1))
	if not root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("kitchen-counter-kit.pxo"),false,target):return {"error":"Explicit source save failed"}
	var atlas=composite(atlas_roles,SIZE.x,SIZE.y)
	atlas.save_png(output_dir.path_join("kitchen-counter-atlas.png"))
	var enlarged=atlas.duplicate()
	enlarged.resize(SIZE.x*4,SIZE.y*4,Image.INTERPOLATE_NEAREST)
	enlarged.save_png(source_dir.path_join("kitchen-counter-preview.png"))
	for id in exports:exports[id].save_png(output_dir.path_join(id+".png"))
	if zip.open(source_dir.path_join("kitchen-counter-kit.pxo"))!=OK:return {"error":"Cannot reopen saved native source"}
	var data=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var reopened=blank(SIZE.x,SIZE.y)
	var lengths=[]
	var populated=0
	for n in range(4):
		var bytes=zip.read_file("image_data/frames/1/layer_"+str(n+1))
		lengths.append(bytes.size())
		if bytes.size()!=SIZE.x*SIZE.y*4:return {"error":"Saved cel byte length mismatch"}
		var pic=Image.create_from_data(SIZE.x,SIZE.y,false,Image.FORMAT_RGBA8,bytes)
		if pic.get_used_rect().has_area():populated+=1
		reopened.blend_rect(pic,Rect2i(Vector2i.ZERO,SIZE),Vector2i.ZERO)
	zip.close()
	var modules_match=true
	var originals_match=true
	var semi=0
	var orphans=0
	for item in modules:
		var pic=Image.load_from_file(output_dir.path_join(item.image))
		var rect=Rect2i(item.rect[0],item.rect[1],item.rect[2],item.rect[3])
		modules_match=modules_match and pic.get_data()==reopened.get_region(rect).get_data()
		if item.id in ["steel-counter-top","steel-counter-front","steel-counter-end-left","steel-counter-end-right"]:
			var accepted=Image.load_from_file(art_root.path_join("kitchen-counter-scale-review/"+item.image))
			originals_match=originals_match and accepted.get_data()==pic.get_data()
		for yy in range(pic.get_height()):
			for xx in range(pic.get_width()):
				var color=pic.get_pixel(xx,yy)
				if color.a>0 and color.a<1:semi+=1
	var saved_palette=JSON.parse_string(data.palettes[0].values()[0])
	var report={"sourceSize":[data.size_x,data.size_y],"sourceLayers":data.layers.size(),"populatedLayers":populated,"celByteSizes":lengths,"paletteSwatches":saved_palette.colors.size(),"frames":data.frames.size(),"tag":data.tags[0].name,"savedSourceMatchesAtlas":reopened.get_data()==atlas.get_data(),"all11ModuleExportsMatchSavedSource":modules_match,"acceptedStraightModulesUnchanged":originals_match,"seamMismatches":join_errors.size(),"acceptedGrillJoinRows":31,"semitransparentPixels":semi,"activeProjectUnchanged":global.get("current_project")==active_before}
	write_json(source_dir.path_join("modules.json"),{"width":160,"height":160,"modules":modules})
	write_json(output_dir.path_join("modules.json"),{"width":160,"height":160,"modules":modules})
	write_json(output_dir.path_join("verification.json"),report)
	return report

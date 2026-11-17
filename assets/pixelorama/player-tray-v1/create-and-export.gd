extends RefCounted

func blank(width,height):
	var out=Image.create(width,height,false,Image.FORMAT_RGBA8)
	out.fill(Color(0,0,0,0))
	return out

func blend(images):
	var out=blank(64,32)
	for img in images: out.blend_rect(img,Rect2i(0,0,64,32),Vector2i.ZERO)
	return out

func write_json(path,value):
	var file=FileAccess.open(path,FileAccess.WRITE)
	file.store_string(JSON.stringify(value,"  "))
	file.close()

func save_preview(img,path,scale):
	var out=img.duplicate()
	out.resize(img.get_width()*scale,img.get_height()*scale,Image.INTERPOLATE_NEAREST)
	return out.save_png(path)

func components(img):
	var pending={}
	for y in range(32):
		for x in range(64):
			if img.get_pixel(x,y).a>0: pending[y*64+x]=true
	var count=0
	while not pending.is_empty():
		count+=1
		var first=pending.keys()[0]
		pending.erase(first)
		var stack=[first]
		while not stack.is_empty():
			var current=int(stack.pop_back())
			var x=current%64
			var y=int(current/64)
			for p in [Vector2i(x-1,y),Vector2i(x+1,y),Vector2i(x,y-1),Vector2i(x,y+1)]:
				var key=p.y*64+p.x
				if p.x>=0 and p.x<64 and p.y>=0 and p.y<32 and pending.has(key):
					pending.erase(key)
					stack.append(key)
	return count

func be32(value):
	return PackedByteArray([(int(value)>>24)&255,(int(value)>>16)&255,(int(value)>>8)&255,int(value)&255])

func be16(value):
	return PackedByteArray([(int(value)>>8)&255,int(value)&255])

func read32(data,offset):
	return (int(data[offset])<<24)|(int(data[offset+1])<<16)|(int(data[offset+2])<<8)|int(data[offset+3])

func crc32(data):
	var crc=0xffffffff
	for byte in data:
		crc=crc^int(byte)
		for bit in range(8): crc=(crc>>1)^0xedb88320 if (crc&1)!=0 else crc>>1
	return (crc^0xffffffff)&0xffffffff

func chunk(kind,payload):
	var data=kind.to_ascii_buffer()
	data.append_array(payload)
	var out=be32(payload.size())
	out.append_array(data)
	out.append_array(be32(crc32(data)))
	return out

func png_parts(img):
	var png=img.save_png_to_buffer()
	var cursor=8
	var header=PackedByteArray()
	var compressed=PackedByteArray()
	while cursor<png.size():
		var length=read32(png,cursor)
		var kind=png.slice(cursor+4,cursor+8).get_string_from_ascii()
		var body=png.slice(cursor+8,cursor+8+length)
		if kind=="IHDR": header=body
		elif kind=="IDAT": compressed.append_array(body)
		cursor+=12+length
	return {"header":header,"compressed":compressed}

func save_apng(frames,path):
	var first=png_parts(frames[0])
	var output=PackedByteArray([137,80,78,71,13,10,26,10])
	output.append_array(chunk("IHDR",first.header))
	var control=be32(frames.size())
	control.append_array(be32(0))
	output.append_array(chunk("acTL",control))
	var sequence=0
	for fi in range(frames.size()):
		var data=be32(sequence)
		sequence+=1
		data.append_array(be32(frames[fi].get_width()))
		data.append_array(be32(frames[fi].get_height()))
		data.append_array(be32(0))
		data.append_array(be32(0))
		data.append_array(be16(1))
		data.append_array(be16(8))
		data.append(0)
		data.append(0)
		output.append_array(chunk("fcTL",data))
		var content=first if fi==0 else png_parts(frames[fi])
		if fi==0: output.append_array(chunk("IDAT",content.compressed))
		else:
			var animation_data=be32(sequence)
			sequence+=1
			animation_data.append_array(content.compressed)
			output.append_array(chunk("fdAT",animation_data))
	output.append_array(chunk("IEND",PackedByteArray()))
	var file=FileAccess.open(path,FileAccess.WRITE)
	file.store_buffer(output)
	file.close()
	return {"frames":4,"fps":8,"width":frames[0].get_width(),"height":frames[0].get_height(),"loops":0}

func draw_rectangles(commands,offset):
	var img=blank(64,32)
	for cmd in commands: img.fill_rect(Rect2i(int(cmd.x)+offset.x,int(cmd.y)+offset.y,int(cmd.w),int(cmd.h)),Color(str(cmd.color)))
	return img

func point(value):
	return Vector2i(int(value.x),int(value.y))

func rect_record(rect):
	return {"x":rect.position.x,"y":rect.position.y,"width":rect.size.x,"height":rect.size.y}

func grid(frames,step,rows):
	var out=blank(128,32*int(ceil(rows.size()/2.0)))
	for i in range(rows.size()): out.blit_rect(frames[int(rows[i])*5+step],Rect2i(0,0,64,32),Vector2i((i%2)*64,int(i/2)*32))
	return out

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var active=root.get_node("Global").get("current_project")
	var source=str(params.source_dir)
	var output=str(params.output_dir)
	DirAccess.make_dir_recursive_absolute(output)
	var spec=JSON.parse_string(FileAccess.get_file_as_string(source.path_join("geometry.json")))
	var tray=Image.load_from_file(str(params.tray_body))
	if tray.get_size()!=Vector2i(24,16): return {"error":"Wrong tray native size"}
	var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"player-tray-v1",Vector2i(64,32))
	for name in spec.sourceLayers: target.layers.append(load("res://src/Classes/Layers/PixelLayer.gd").new(target,str(name)))
	var sheets={}
	for name in ["player-with-tray","actor","actor-behind-tray","actor-in-front-of-tray","tray-overlay","skin-mask","outfit-mask","skin-layer","outfit-layer"]: sheets[name]=blank(320,256)
	var material_sheets=[]
	for li in range(9): material_sheets.append(blank(320,256))
	var composites=[]
	var all_images=[]
	var records=[]
	var recolors=[]
	var report={"frames":40,"layers":11,"sourceCelsExact":0,"savedCompositesExact":0,"originalOpaqueHeadPixelsExact":0,"originalOpaqueHeadPixelsCompared":0,"lowerMaterialLayersExact":0,"unchangedApronFrames":0,"approvedSouthActorsExact":0,"approvedSouthCompositesExact":0,"reconstructedPartsExact":0,"actorComponents":[],"combinedComponents":[],"distinctWalkPoses":{},"recolorIsolationChecks":0,"neutralChanges":0,"maskOverlapPixels":0,"trayPixelsExactFrames":0,"trayLevelAndStationaryGroups":0,"palmEdgeContacts":0,"farPalmsOccluded":0,"groundedFrames":0,"semiTransparentPixels":0,"failures":[]}
	var approved_actor=Image.load_from_file(source.get_base_dir().get_base_dir().get_base_dir().path_join("apps/web/public/art/player-tray-front-review/actor.png"))
	var approved_combined=Image.load_from_file(source.get_base_dir().get_base_dir().get_base_dir().path_join("apps/web/public/art/player-tray-front-review/player-with-tray.png"))
	for fi in range(40):
		var definition=spec.frames[fi]
		var direction=spec.directions[definition.direction]
		var row=int(fi/5)
		var step=fi%5
		var origin=Vector2i(step*64,row*32)
		var originals=[]
		var body=[]
		var arms=[]
		for li in range(9):
			originals.append(draw_rectangles(definition.originalRectangles[li],Vector2i(24,8)))
			var layer=draw_rectangles(definition.baseRectangles[li],Vector2i(24,8))
			for clear in definition.clearRegions:
				if int(clear.layer)==li: layer.fill_rect(Rect2i(int(clear.x)+24,int(clear.y)+8,int(clear.w),int(clear.h)),Color(0,0,0,0))
			body.append(layer)
			arms.append(draw_rectangles(definition.raisedArmRectangles[li],Vector2i.ZERO))
		var original=blend(originals)
		var filtered=blend(body)
		for li in range(9):
			for y in range(32):
				for x in range(64):
					if arms[li].get_pixel(x,y).a>0 and (not definition.armBehindBody or filtered.get_pixel(x,y).a==0): body[li].set_pixel(x,y,arms[li].get_pixel(x,y))
		if definition.restoreOriginalHead:
			for y in range(8,19):
				for x in range(24,40):
					if original.get_pixel(x,y).a>0:
						for li in range(9): body[li].set_pixel(x,y,originals[li].get_pixel(x,y))
		var actor=blend(body)
		for y in range(8,19):
			for x in range(24,40):
				if original.get_pixel(x,y).a>0:
					report.originalOpaqueHeadPixelsCompared+=1
					if original.get_pixel(x,y)==actor.get_pixel(x,y): report.originalOpaqueHeadPixelsExact+=1
		for li in [0,1,2]:
			if body[li].get_data()==originals[li].get_data(): report.lowerMaterialLayersExact+=1
			else: report.failures.append("Lower material changed "+str(fi)+":"+str(li))
		if body[6].get_data()==originals[6].get_data(): report.unchangedApronFrames+=1
		else: report.failures.append("Apron changed "+str(fi))
		var tray_full=blank(64,32)
		tray_full.blit_rect(tray,Rect2i(0,0,24,16),point(direction.trayOrigin))
		var tray_behind=blank(64,32)
		var tray_front=blank(64,32)
		var actor_behind=blank(64,32)
		var actor_front=blank(64,32)
		for y in range(32):
			for x in range(64):
				var foreground=direction.actorForegroundMode=="all" or (direction.actorForegroundMode=="head" and x>=24 and x<40 and y>=8 and y<19 and original.get_pixel(x,y).a>0)
				if foreground:
					actor_front.set_pixel(x,y,actor.get_pixel(x,y))
					tray_behind.set_pixel(x,y,tray_full.get_pixel(x,y))
				else:
					actor_behind.set_pixel(x,y,actor.get_pixel(x,y))
					tray_front.set_pixel(x,y,tray_full.get_pixel(x,y))
		var images=[tray_behind]
		images.append_array(body)
		images.append(tray_front)
		var composite=blend(images)
		if blend([actor_behind,tray_full,actor_front]).get_data()==composite.get_data(): report.reconstructedPartsExact+=1
		else: report.failures.append("Parts fail reconstruction "+str(fi))
		if blend([tray_behind,tray_front]).get_region(Rect2i(point(direction.trayOrigin),Vector2i(24,16))).get_data()==tray.get_data(): report.trayPixelsExactFrames+=1
		if row==0:
			if actor.get_region(Rect2i(20,0,40,32)).get_data()==approved_actor.get_region(Rect2i(step*40,0,40,32)).get_data(): report.approvedSouthActorsExact+=1
			else: report.failures.append("Approved south actor changed "+str(fi))
			if composite.get_region(Rect2i(20,0,40,32)).get_data()==approved_combined.get_region(Rect2i(step*40,0,40,32)).get_data(): report.approvedSouthCompositesExact+=1
			else: report.failures.append("Approved south composite changed "+str(fi))
		var palm=point(direction.supportPalm)
		if tray_full.get_pixel(palm.x,palm.y-1).a>0 and tray_full.get_pixel(palm.x,palm.y).a==0:
			if body[4].get_pixel(palm.x,palm.y).a>0: report.palmEdgeContacts+=1
			elif direction.armDepth=="far" and actor.get_pixel(palm.x,palm.y).a>0: report.farPalmsOccluded+=1
		var grounded=false
		for x in range(64):
			if body[1].get_pixel(x,31).a>0: grounded=true
		if grounded: report.groundedFrames+=1
		report.actorComponents.append(components(actor))
		report.combinedComponents.append(components(composite))
		var frame=load("res://src/Classes/Frame.gd").new()
		frame.duration=4 if step==0 else 1
		for li in range(11): frame.cels.append(target.layers[li].new_cel_from_image(images[li]))
		target.frames.append(frame)
		all_images.append(images)
		composites.append(composite)
		for pair in [["player-with-tray",composite],["actor",actor],["actor-behind-tray",actor_behind],["actor-in-front-of-tray",actor_front],["tray-overlay",tray_full]]: sheets[pair[0]].blit_rect(pair[1],Rect2i(0,0,64,32),origin)
		for li in range(9): material_sheets[li].blit_rect(body[li],Rect2i(0,0,64,32),origin)
		var role_record={"index":fi,"direction":definition.direction,"state":definition.state,"step":step,"sheetRect":rect_record(Rect2i(origin,Vector2i(64,32))),"roles":{}}
		for role_name in ["skin","outfit"]:
			var role=spec.roles[role_name]
			var li=int(role.layer)
			var mask=blank(64,32)
			var tones={}
			for tone in role.tones: tones[tone]=[]
			var changed=0
			var recolored=composite.duplicate()
			for y in range(32):
				for x in range(64):
					var visible=composite.get_pixel(x,y)
					for tone in role.tones:
						if visible.a>0 and visible==Color(str(role.tones[tone])) and body[li].get_pixel(x,y)==visible:
							mask.set_pixel(x,y,Color.WHITE)
							tones[tone].append([x,y])
							recolored.set_pixel(x,y,Color("#19e6c4"))
							changed+=1
			var actual=0
			for y in range(32):
				for x in range(64):
					if recolored.get_pixel(x,y)!=composite.get_pixel(x,y):
						actual+=1
						if mask.get_pixel(x,y).a==0: report.neutralChanges+=1
			if actual!=changed: report.failures.append("Recolor count differs")
			report.recolorIsolationChecks+=1
			sheets[role_name+"-mask"].blit_rect(mask,Rect2i(0,0,64,32),origin)
			sheets[role_name+"-layer"].blit_rect(body[li],Rect2i(0,0,64,32),origin)
			role_record.roles[role_name]={"visibleTonePixels":tones}
		recolors.append(role_record)
		records.append({"index":fi,"direction":definition.direction,"state":definition.state,"step":step,"x":origin.x,"y":origin.y,"width":64,"height":32,"durationMs":500 if step==0 else 125,"durationMultiplier":frame.duration})
		for y in range(32):
			for x in range(64):
				var color=composite.get_pixel(x,y)
				if color.a!=0 and color.a!=1: report.semiTransparentPixels+=1
				if color.a>0 and not spec.palette.has("#"+color.to_html(false)): report.failures.append("Palette mismatch")
	for row in range(8):
		var unique=[]
		for step in range(1,5):
			var data=composites[row*5+step].get_data()
			if not unique.has(data): unique.append(data)
		report.distinctWalkPoses[spec.rowOrder[row]]=unique.size()
		if unique.size()!=4: report.failures.append("Repeated walk in "+str(spec.rowOrder[row]))
		var stable=true
		for step in range(1,5):
			if sheets["tray-overlay"].get_region(Rect2i(step*64,row*32,64,32)).get_data()!=sheets["tray-overlay"].get_region(Rect2i(0,row*32,64,32)).get_data(): stable=false
		if stable: report.trayLevelAndStationaryGroups+=1
	for y in range(256):
		for x in range(320):
			if sheets["skin-mask"].get_pixel(x,y).a>0 and sheets["outfit-mask"].get_pixel(x,y).a>0: report.maskOverlapPixels+=1
	if report.originalOpaqueHeadPixelsExact!=report.originalOpaqueHeadPixelsCompared: report.failures.append("Original head pixels changed")
	if report.actorComponents.any(func(value): return value!=1) or report.combinedComponents.any(func(value): return value!=1): report.failures.append("Detached actor/tray components")
	if report.palmEdgeContacts+report.farPalmsOccluded!=40: report.failures.append("Some palms miss tray edge")
	target.fps=8
	target.current_frame=0
	target.current_layer=0
	var pal=load("res://src/Palette/Palette.gd").new("Tray worker - approved17",9,2,"Original worker palette and original neutral tray")
	pal.is_project_palette=true
	for color in spec.palette: pal.add_color(Color(str(color)))
	target.palettes[pal.name]=pal
	target.project_current_palette_name=pal.name
	var animations={}
	for row in range(8):
		var direction=str(spec.rowOrder[row])
		for tag in [["carry_idle_"+direction,row*5+1,row*5+1],["carry_walk_"+direction,row*5+2,row*5+5]]: target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new(tag[0],Color("#ee75a3"),tag[1],tag[2]))
		animations["carry_idle_"+direction]={"frames":[row*5],"fps":2}
		animations["carry_walk_"+direction]={"frames":[row*5+1,row*5+2,row*5+3,row*5+4],"fps":8}
	if not root.get_node("OpenSave").call("save_pxo_file",source.path_join("player-tray-v1.pxo"),false,target): return {"error":"Native save failed"}
	var zip=ZIPReader.new()
	if zip.open(source.path_join("player-tray-v1.pxo"))!=OK: return {"error":"Cannot inspect saved PXO"}
	var metadata=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	if int(metadata.size_x)!=64 or int(metadata.size_y)!=32 or metadata.frames.size()!=40 or metadata.layers.size()!=11 or metadata.tags.size()!=16: report.failures.append("Saved metadata differs")
	var saved_palette=JSON.parse_string(metadata.palettes[0].values()[0])
	report.paletteSwatches=saved_palette.colors.size()
	report.sourceFps=metadata.fps
	if report.paletteSwatches!=17 or int(metadata.fps)!=8: report.failures.append("Saved palette or timeline rate differs")
	for li in range(11):
		if str(metadata.layers[li].name)!=str(spec.sourceLayers[li]): report.failures.append("Saved layer name differs")
	for fi in range(40):
		if int(metadata.frames[fi].duration)!=(4 if fi%5==0 else 1): report.failures.append("Saved timing differs")
		var rebuilt=[]
		for li in range(11):
			var raw=zip.read_file("image_data/frames/"+str(fi+1)+"/layer_"+str(li+1))
			if raw==all_images[fi][li].get_data(): report.sourceCelsExact+=1
			else: report.failures.append("Saved cel differs")
			rebuilt.append(Image.create_from_data(64,32,false,Image.FORMAT_RGBA8,raw))
		if blend(rebuilt).get_data()==composites[fi].get_data(): report.savedCompositesExact+=1
		else: report.failures.append("Saved composite differs")
	for row in range(8):
		for pair in [[row*2,"carry_idle_",row*5+1,row*5+1],[row*2+1,"carry_walk_",row*5+2,row*5+5]]:
			var tag=metadata.tags[pair[0]]
			if str(tag.name)!=pair[1]+str(spec.rowOrder[row]) or int(tag.from)!=pair[2] or int(tag.to)!=pair[3]: report.failures.append("Saved tag differs")
	zip.close()
	for name in sheets: sheets[name].save_png(output.path_join(name+".png"))
	for li in range(9): material_sheets[li].save_png(output.path_join("material-"+str(li)+".png"))
	var all_rows=[0,1,2,3,4,5,6,7]
	var idle_grid=grid(composites,0,all_rows)
	idle_grid.save_png(output.path_join("carry-idles-native.png"))
	for directory in [source,output]: save_preview(idle_grid,directory.path_join("carry-eight-idles-preview.png"),5)
	var motion=[]
	for step in range(1,5):
		var enlarged=grid(composites,step,all_rows)
		enlarged.resize(640,640,Image.INTERPOLATE_NEAREST)
		motion.append(enlarged)
	for directory in [source,output]: report.motion=save_apng(motion,directory.path_join("carry-eight-walking-preview.png"))
	for group in [["cardinal",[0,1,2,3]],["diagonal",[4,5,6,7]]]:
		var group_frames=[]
		for step in range(1,5):
			var enlarged=grid(composites,step,group[1])
			enlarged.resize(768,384,Image.INTERPOLATE_NEAREST)
			group_frames.append(enlarged)
		for directory in [source,output]: save_apng(group_frames,directory.path_join("carry-"+group[0]+"-walking-preview.png"))
	var tray_zip=ZIPReader.new()
	if tray_zip.open(source.get_base_dir().path_join("serving-tray-review/serving-tray.pxo"))!=OK: return {"error":"Cannot read original tray source"}
	var surface=Image.create_from_data(24,16,false,Image.FORMAT_RGBA8,tray_zip.read_file("image_data/frames/1/layer_3"))
	tray_zip.close()
	var surface_mask=blank(24,16)
	for y in range(16):
		for x in range(24):
			if surface.get_pixel(x,y).a>0: surface_mask.set_pixel(x,y,Color.WHITE)
	surface_mask.save_png(output.path_join("tray-surface-mask.png"))
	tray.save_png(output.path_join("tray-body.png"))
	var attachments={"physicalHand":"left","holdHeight":"shoulder","frameSize":spec.frameSize,"bodyOffset":spec.bodyOffset,"bodySize":spec.bodySize,"footAnchor":spec.footAnchor,"trayNativeSize":{"width":24,"height":16},"trayVisibleSize":{"width":20,"height":11},"surfaceMask":"tray-surface-mask.png","surfaceLocalBounds":rect_record(surface.get_used_rect()),"surfaceLocalCenter":{"x":12,"y":7},"drawOrder":["actor-behind-tray.png frame","tray-body.png at trayOrigin OR tray-overlay.png frame","future independent items on surface","actor-in-front-of-tray.png frame"],"itemSlots":null,"capacity":null,"directions":spec.directions,"frames":[]}
	for fi in range(40):
		var d=spec.directions[spec.frames[fi].direction]
		var surface_rect=surface.get_used_rect()
		surface_rect.position+=point(d.trayOrigin)
		attachments.frames.append({"index":fi,"direction":spec.frames[fi].direction,"step":fi%5,"footAnchor":spec.footAnchor,"supportPalm":d.supportPalm,"supportElbow":d.supportElbow,"trayOrigin":d.trayOrigin,"traySupportLocal":d.traySupportLocal,"trayMotionOffset":{"x":0,"y":0},"surfaceFrameBounds":rect_record(surface_rect),"surfaceFrameCenter":{"x":int(d.trayOrigin.x)+12,"y":int(d.trayOrigin.y)+7},"actorForegroundMode":d.actorForegroundMode})
	for directory in [source,output]: write_json(directory.path_join("attachments.json"),attachments)
	write_json(source.path_join("frame-records.json"),records)
	write_json(output.path_join("recolor-map.json"),{"frameSize":spec.frameSize,"sheetSize":spec.sheetSize,"layerIndexing":"roles.layer refers to zero-based actor material index; Pixelorama source layer is roles.layer + 1 because the rear tray layer is first","roles":spec.roles,"frames":recolors,"neutralPixelsExcluded":true})
	write_json(output.path_join("manifest.json"),{"status":"eight-direction-carry-complete","physicalHand":"left","holdHeight":"shoulder","frameSize":spec.frameSize,"sheetSize":spec.sheetSize,"bodySize":spec.bodySize,"bodyOffset":spec.bodyOffset,"footAnchor":spec.footAnchor,"rowOrder":spec.rowOrder,"source":"assets/pixelorama/player-tray-v1/player-tray-v1.pxo","sourceLayers":spec.sourceLayers,"actorMaterialLayers":spec.bodyLayers,"materialSheets":["material-0.png","material-1.png","material-2.png","material-3.png","material-4.png","material-5.png","material-6.png","material-7.png","material-8.png"],"palette":"palette.json","sourcePalette":"assets/pixelorama/player-tray-v1/palette.json","parts":{"actorBehind":"actor-behind-tray.png","trayOverlay":"tray-overlay.png","actorForeground":"actor-in-front-of-tray.png","actorComplete":"actor.png","combined":"player-with-tray.png","nativeTray":"tray-body.png"},"drawOrder":["actorBehind","trayOverlay","actorForeground"],"preview":"carry-eight-walking-preview.png","idlePreview":"carry-eight-idles-preview.png","attachments":"attachments.json","recolorMap":"recolor-map.json","frameIndexing":"zero-based public frames; one-based Pixelorama tags","fps":8,"frameRecords":records,"animations":animations,"itemsIncluded":false,"engineLogicImplemented":false})
	report.activeProjectUnchanged=root.get_node("Global").get("current_project")==active
	write_json(source.path_join("verification.json"),report)
	return report


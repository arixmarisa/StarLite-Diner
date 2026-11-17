extends RefCounted

func blank(width,height):
	var out=Image.create(width,height,false,Image.FORMAT_RGBA8)
	out.fill(Color(0,0,0,0))
	return out

func blend(images):
	var out=blank(40,32)
	for img in images: out.blend_rect(img,Rect2i(0,0,40,32),Vector2i.ZERO)
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
		for x in range(40):
			if img.get_pixel(x,y).a>0: pending[y*40+x]=true
	var count=0
	while not pending.is_empty():
		count+=1
		var first=pending.keys()[0]
		pending.erase(first)
		var stack=[first]
		while not stack.is_empty():
			var current=int(stack.pop_back())
			var x=current%40
			var y=int(current/40)
			for p in [Vector2i(x-1,y),Vector2i(x+1,y),Vector2i(x,y-1),Vector2i(x,y+1)]:
				var key=p.y*40+p.x
				if p.x>=0 and p.x<40 and p.y>=0 and p.y<32 and pending.has(key):
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

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var active=root.get_node("Global").get("current_project")
	var source=str(params.source_dir)
	var output=str(params.output_dir)
	DirAccess.make_dir_recursive_absolute(output)
	var spec=JSON.parse_string(FileAccess.get_file_as_string(source.path_join("geometry.json")))
	var tray=Image.load_from_file(str(params.tray_body))
	if tray.get_size()!=Vector2i(24,16): return {"error":"Tray native size differs"}
	var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"player-tray-front-review",Vector2i(40,32))
	for name in spec.layers: target.layers.append(load("res://src/Classes/Layers/PixelLayer.gd").new(target,str(name)))
	var sheet=blank(200,32)
	var actor_sheet=blank(200,32)
	var tray_overlay=blank(40,32)
	tray_overlay.blit_rect(tray,Rect2i(0,0,24,16),Vector2i(14,6))
	var masks={"skin":blank(200,32),"outfit":blank(200,32)}
	var material_sheets={"skin":blank(200,32),"outfit":blank(200,32)}
	var composites=[]
	var all_images=[]
	var reference_idle=blank(40,32)
	var records=[]
	var recolors=[]
	var report={"frames":5,"layers":10,"sourceCelsExact":0,"headAndCapFramesExact":0,"lowerMaterialLayersExact":0,"unchangedApronFrames":0,"actorComponents":[],"combinedComponents":[],"distinctWalkPoses":0,"recolorIsolationChecks":0,"neutralChanges":0,"trayPixelsExact":true,"trayLevelAndStationary":true,"semiTransparentPixels":0,"failures":[]}
	for fi in range(5):
		var definition=spec.frames[fi]
		var images=[]
		var base_images=[]
		for li in range(9):
			var base=blank(40,32)
			for cmd in definition.originalRectangles[li]:
				base.fill_rect(Rect2i(int(cmd.x)+4,int(cmd.y)+8,int(cmd.w),int(cmd.h)),Color(str(cmd.color)))
			base_images.append(base.duplicate())
			for clear in definition.clearRegions:
				if int(clear.layer)==li: base.fill_rect(Rect2i(int(clear.x)+4,int(clear.y)+8,int(clear.w),int(clear.h)),Color(0,0,0,0))
			for cmd in definition.raisedArmRectangles[li]:
				base.fill_rect(Rect2i(int(cmd.x),int(cmd.y),int(cmd.w),int(cmd.h)),Color(str(cmd.color)))
			images.append(base)
		var actor=blend(images)
		var old_actor=blend(base_images)
		if fi==0: reference_idle=old_actor.duplicate()
		var head_bounds=old_actor.get_region(Rect2i(4,8,16,11)).get_used_rect()
		head_bounds.position+=Vector2i(4,8)
		report.headComparisonBounds={"x":head_bounds.position.x,"y":head_bounds.position.y,"width":head_bounds.size.x,"height":head_bounds.size.y}
		if actor.get_region(head_bounds).get_data()==old_actor.get_region(head_bounds).get_data(): report.headAndCapFramesExact+=1
		else: report.failures.append("Head or cap altered")
		for li in [0,1,2]:
			if images[li].get_data()==base_images[li].get_data(): report.lowerMaterialLayersExact+=1
			else: report.failures.append("Original shadow/shoes/trousers changed")
		if images[6].get_data()==base_images[6].get_data(): report.unchangedApronFrames+=1
		else: report.failures.append("Apron changed")
		images.append(tray_overlay.duplicate())
		var composite=blend(images)
		report.actorComponents.append(components(actor))
		report.combinedComponents.append(components(composite))
		var frame=load("res://src/Classes/Frame.gd").new()
		frame.duration=4 if fi==0 else 1
		for li in range(10): frame.cels.append(target.layers[li].new_cel_from_image(images[li]))
		target.frames.append(frame)
		all_images.append(images)
		composites.append(composite)
		var origin=Vector2i(fi*40,0)
		sheet.blit_rect(composite,Rect2i(0,0,40,32),origin)
		actor_sheet.blit_rect(actor,Rect2i(0,0,40,32),origin)
		var role_record={"index":fi,"direction":"south","state":definition.state,"sheetRect":{"x":fi*40,"y":0,"width":40,"height":32},"roles":{}}
		for role_name in ["skin","outfit"]:
			var role=spec.roles[role_name]
			var li=int(role.layer)
			var mask=blank(40,32)
			var tones={}
			for tone in role.tones: tones[tone]=[]
			var recolored=composite.duplicate()
			var eligible_count=0
			for y in range(32):
				for x in range(40):
					var visible=composite.get_pixel(x,y)
					for tone in role.tones:
						if visible.a>0 and visible==Color(str(role.tones[tone])) and images[li].get_pixel(x,y)==visible:
							mask.set_pixel(x,y,Color.WHITE)
							tones[tone].append([x,y])
							recolored.set_pixel(x,y,Color("#19e6c4"))
							eligible_count+=1
			var changed_count=0
			for y in range(32):
				for x in range(40):
					if recolored.get_pixel(x,y)!=composite.get_pixel(x,y):
						changed_count+=1
						if mask.get_pixel(x,y).a==0: report.neutralChanges+=1
			if changed_count!=eligible_count: report.failures.append("Recolor count mismatch")
			report.recolorIsolationChecks+=1
			material_sheets[role_name].blit_rect(images[li],Rect2i(0,0,40,32),origin)
			masks[role_name].blit_rect(mask,Rect2i(0,0,40,32),origin)
			role_record.roles[role_name]={"visibleTonePixels":tones}
		recolors.append(role_record)
		records.append({"index":fi,"direction":"south","state":definition.state,"x":fi*40,"y":0,"width":40,"height":32,"durationMs":500 if fi==0 else 125,"durationMultiplier":frame.duration})
		for y in range(32):
			for x in range(40):
				var color=composite.get_pixel(x,y)
				if color.a!=0 and color.a!=1: report.semiTransparentPixels+=1
				if color.a>0 and not spec.palette.has("#"+color.to_html(false)): report.failures.append("Palette mismatch")
	target.fps=8
	target.current_frame=0
	target.current_layer=0
	var pal=load("res://src/Palette/Palette.gd").new("Player tray front - original palette",9,2,"Original17workercolors; native kitchen tray uses existing neutral ramp")
	pal.is_project_palette=true
	for color in spec.palette: pal.add_color(Color(str(color)))
	target.palettes[pal.name]=pal
	target.project_current_palette_name=pal.name
	for tag in [["carry_idle_south",1,1],["carry_walk_south",2,5]]: target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new(tag[0],Color("#ee75a3"),tag[1],tag[2]))
	var unique=[]
	for fi in range(1,5):
		var data=composites[fi].get_data()
		if not unique.has(data): unique.append(data)
	report.distinctWalkPoses=unique.size()
	if report.actorComponents!=[1,1,1,1,1] or report.combinedComponents!=[1,1,1,1,1]: report.failures.append("Detached body/tray component")
	if report.distinctWalkPoses!=4: report.failures.append("Walk poses repeat")
	if not root.get_node("OpenSave").call("save_pxo_file",source.path_join("player-tray-front.pxo"),false,target): return {"error":"Native save failed"}
	var zip=ZIPReader.new()
	if zip.open(source.path_join("player-tray-front.pxo"))!=OK: return {"error":"Cannot inspect saved source"}
	var metadata=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	if int(metadata.size_x)!=40 or int(metadata.size_y)!=32 or metadata.frames.size()!=5 or metadata.layers.size()!=10 or metadata.tags.size()!=2: report.failures.append("Wrong saved metadata")
	var saved_palette=JSON.parse_string(metadata.palettes[0].values()[0])
	report.paletteSwatches=saved_palette.colors.size()
	report.sourceFps=metadata.fps
	if report.paletteSwatches!=17 or int(metadata.fps)!=8: report.failures.append("Palette or timeline rate differs")
	for li in range(10):
		if str(metadata.layers[li].name)!=str(spec.layers[li]): report.failures.append("Source layer names differ")
	for fi in range(5):
		if int(metadata.frames[fi].duration)!=(4 if fi==0 else 1): report.failures.append("Source frame duration differs")
	if metadata.tags[0].name!="carry_idle_south" or int(metadata.tags[0].from)!=1 or int(metadata.tags[0].to)!=1 or metadata.tags[1].name!="carry_walk_south" or int(metadata.tags[1].from)!=2 or int(metadata.tags[1].to)!=5: report.failures.append("Saved tag ranges differ")
	for fi in range(5):
		var rebuilt=[]
		for li in range(10):
			var raw=zip.read_file("image_data/frames/"+str(fi+1)+"/layer_"+str(li+1))
			if raw!=all_images[fi][li].get_data(): report.failures.append("Saved cel mismatch")
			else: report.sourceCelsExact+=1
			rebuilt.append(Image.create_from_data(40,32,false,Image.FORMAT_RGBA8,raw))
		if blend(rebuilt).get_data()!=composites[fi].get_data(): report.failures.append("Saved composite mismatch")
	zip.close()
	report.trayPixelsExact=tray_overlay.get_region(Rect2i(14,6,24,16)).get_data()==tray.get_data()
	report.trayLevelAndStationary=true
	report.supportPalm=spec.hand.supportPalm
	report.supportElbow=spec.hand.elbow
	report.palmMeetsTrayUnderside=true
	var palm=Vector2i(int(spec.hand.supportPalm.x),int(spec.hand.supportPalm.y))
	var tray_point=Vector2i(int(spec.tray.origin.x)+int(spec.tray.supportPointLocal.x),int(spec.tray.origin.y)+int(spec.tray.supportPointLocal.y))
	if palm!=tray_point or tray_overlay.get_pixel(palm.x,palm.y-1).a==0 or tray_overlay.get_pixel(palm.x,palm.y).a>0: report.palmMeetsTrayUnderside=false
	report.groundedFrames=0
	report.maskOverlapPixels=0
	for fi in range(5):
		if all_images[fi][9].get_data()!=tray_overlay.get_data(): report.trayLevelAndStationary=false
		if all_images[fi][4].get_pixel(palm.x,palm.y).a==0: report.palmMeetsTrayUnderside=false
		var grounded=false
		for x in range(40):
			if all_images[fi][1].get_pixel(x,31).a>0: grounded=true
		if grounded: report.groundedFrames+=1
	for y in range(32):
		for x in range(200):
			if masks.skin.get_pixel(x,y).a>0 and masks.outfit.get_pixel(x,y).a>0: report.maskOverlapPixels+=1
	if not report.trayPixelsExact or not report.trayLevelAndStationary or not report.palmMeetsTrayUnderside or report.groundedFrames!=5 or report.maskOverlapPixels!=0 or report.neutralChanges!=0 or report.semiTransparentPixels!=0: report.failures.append("Tray/ground/mask/contact isolation check failed")
	var tray_zip=ZIPReader.new()
	var tray_source=source.get_base_dir().path_join("serving-tray-review/serving-tray.pxo")
	if tray_zip.open(tray_source)!=OK: return {"error":"Cannot inspect original tray surface"}
	var surface_bytes=tray_zip.read_file("image_data/frames/1/layer_3")
	if surface_bytes.size()!=24*16*4: return {"error":"Wrong original tray surface size"}
	var surface=Image.create_from_data(24,16,false,Image.FORMAT_RGBA8,surface_bytes)
	tray_zip.close()
	var surface_mask=blank(24,16)
	for y in range(16):
		for x in range(24):
			if surface.get_pixel(x,y).a>0: surface_mask.set_pixel(x,y,Color.WHITE)
	var surface_rect=surface.get_used_rect()
	surface_mask.save_png(output.path_join("tray-surface-mask.png"))
	var attachments={"direction":"south","physicalHand":"left","screenSide":"right","holdHeight":"shoulder","frameSize":spec.frameSize,"bodyOffset":spec.actorBodyOffset,"bodySize":spec.actorBodySize,"footAnchor":spec.footAnchor,"collisionReference":spec.collision,"interactionZone":null,"tray":spec.tray,"surface":{"mask":"tray-surface-mask.png","maskSize":{"width":24,"height":16},"localBounds":{"x":surface_rect.position.x,"y":surface_rect.position.y,"width":surface_rect.size.x,"height":surface_rect.size.y},"frameBounds":{"x":14+surface_rect.position.x,"y":6+surface_rect.position.y,"width":surface_rect.size.x,"height":surface_rect.size.y},"center":{"x":26,"y":13},"itemSlots":null,"capacity":null},"drawOrder":["actor.png frame","original tray-body.png at tray.origin, or tray-overlay.png at frame origin","future item assets on tray surface"],"frames":[]}
	for fi in range(5): attachments.frames.append({"index":fi,"footAnchor":spec.footAnchor,"supportPalm":spec.hand.supportPalm,"trayOrigin":spec.tray.origin,"trayMotionOffset":{"x":0,"y":0}})
	write_json(output.path_join("attachments.json"),attachments)
	write_json(source.path_join("attachments.json"),attachments)
	report.traySurfaceBounds=attachments.surface.localBounds
	sheet.save_png(output.path_join("player-with-tray.png"))
	actor_sheet.save_png(output.path_join("actor.png"))
	tray_overlay.save_png(output.path_join("tray-overlay.png"))
	composites[0].save_png(output.path_join("carry-idle-south.png"))
	save_preview(composites[0],source.path_join("carry-idle-preview.png"),12)
	save_preview(composites[0],output.path_join("carry-idle-preview.png"),12)
	save_preview(sheet,source.path_join("carry-sheet-preview.png"),6)
	save_preview(sheet,output.path_join("carry-sheet-preview.png"),6)
	var comparison_images=[blank(80,40),blank(80,40)]
	comparison_images[0].blit_rect(reference_idle,Rect2i(4,8,16,24),Vector2i(4,8))
	comparison_images[1].blit_rect(composites[0],Rect2i(0,0,40,32),Vector2i(32,0))
	var comparison=blank(80,40)
	for part in comparison_images: comparison.blend_rect(part,Rect2i(0,0,80,40),Vector2i.ZERO)
	comparison.save_png(output.path_join("comparison.png"))
	save_preview(comparison,source.path_join("comparison-preview.png"),8)
	save_preview(comparison,output.path_join("comparison-preview.png"),8)
	var comparison_project=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"player-tray-front-comparison",Vector2i(80,40))
	var comparison_frame=load("res://src/Classes/Frame.gd").new()
	for li in range(2):
		comparison_project.layers.append(load("res://src/Classes/Layers/PixelLayer.gd").new(comparison_project,["01 - unchanged native worker reference","02 - front carrying pose native composite"][li]))
		comparison_frame.cels.append(comparison_project.layers[li].new_cel_from_image(comparison_images[li]))
	comparison_project.frames.append(comparison_frame)
	comparison_project.fps=1
	comparison_project.current_frame=0
	comparison_project.current_layer=0
	var comparison_palette=load("res://src/Palette/Palette.gd").new("Player tray comparison - original17",9,2,"Same native colors and body scale")
	comparison_palette.is_project_palette=true
	for color in spec.palette: comparison_palette.add_color(Color(str(color)))
	comparison_project.palettes[comparison_palette.name]=comparison_palette
	comparison_project.project_current_palette_name=comparison_palette.name
	comparison_project.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new("carry_front_comparison",Color("#ee75a3"),1,1))
	if not root.get_node("OpenSave").call("save_pxo_file",source.path_join("comparison.pxo"),false,comparison_project): return {"error":"Comparison native save failed"}
	var comparison_zip=ZIPReader.new()
	if comparison_zip.open(source.path_join("comparison.pxo"))!=OK: return {"error":"Comparison saved source cannot be inspected"}
	report.comparisonSavedCelsExact=0
	var rebuilt_comparison=blank(80,40)
	for li in range(2):
		var raw=comparison_zip.read_file("image_data/frames/1/layer_"+str(li+1))
		if raw==comparison_images[li].get_data(): report.comparisonSavedCelsExact+=1
		else: report.failures.append("Saved comparison layer differs")
		rebuilt_comparison.blend_rect(Image.create_from_data(80,40,false,Image.FORMAT_RGBA8,raw),Rect2i(0,0,80,40),Vector2i.ZERO)
	comparison_zip.close()
	if rebuilt_comparison.get_data()!=comparison.get_data(): report.failures.append("Saved comparison composite differs")
	var motion=[]
	for fi in range(1,5):
		var enlarged=composites[fi].duplicate()
		enlarged.resize(480,384,Image.INTERPOLATE_NEAREST)
		motion.append(enlarged)
	report.motion=save_apng(motion,source.path_join("carry-motion-preview.png"))
	save_apng(motion,output.path_join("carry-motion-preview.png"))
	save_apng(motion,source.path_join("carry-motion-upright-preview.png"))
	save_apng(motion,output.path_join("carry-motion-upright-preview.png"))
	for role in ["skin","outfit"]:
		masks[role].save_png(output.path_join(role+"-mask.png"))
		material_sheets[role].save_png(output.path_join(role+"-layer.png"))
	write_json(output.path_join("recolor-map.json"),{"frameSize":spec.frameSize,"sheetSize":{"width":200,"height":32},"roles":spec.roles,"frames":recolors,"neutralPixelsExcluded":true})
	write_json(source.path_join("frame-records.json"),records)
	write_json(output.path_join("manifest.json"),{"status":"front-review-only","direction":"south","carryingHand":"left","holdHeight":"shoulder","frameSize":spec.frameSize,"sheetSize":{"width":200,"height":32},"bodyOffset":spec.actorBodyOffset,"bodySize":spec.actorBodySize,"footAnchor":spec.footAnchor,"hand":spec.hand,"tray":spec.tray,"layers":spec.layers,"source":"assets/pixelorama/player-tray-front-review/player-tray-front.pxo","actor":"actor.png","trayOverlay":"tray-overlay.png","combined":"player-with-tray.png","preview":"carry-motion-upright-preview.png","idlePreview":"carry-idle-preview.png","comparisonPreview":"comparison-preview.png","attachments":"attachments.json","fps":8,"frameRecords":records,"animations":{"carry_idle_south":{"frames":[0],"fps":2},"carry_walk_south":{"frames":[1,2,3,4],"fps":8}},"itemsIncluded":false,"engineLogicImplemented":false,"otherDirectionsApproved":false})
	report.activeProjectUnchanged=root.get_node("Global").get("current_project")==active
	write_json(source.path_join("verification.json"),report)
	return report

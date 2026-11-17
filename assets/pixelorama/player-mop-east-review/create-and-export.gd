extends RefCounted

func blank(width,height):
	var out=Image.create(width,height,false,Image.FORMAT_RGBA8)
	out.fill(Color(0,0,0,0))
	return out

func blend(images):
	var out=blank(48,40)
	for img in images: out.blend_rect(img,Rect2i(0,0,48,40),Vector2i.ZERO)
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
	for y in range(40):
		for x in range(48):
			if img.get_pixel(x,y).a>0: pending[y*48+x]=true
	var count=0
	while not pending.is_empty():
		count+=1
		var first=pending.keys()[0]
		pending.erase(first)
		var stack=[first]
		while not stack.is_empty():
			var current=int(stack.pop_back())
			var x=current%48
			var y=int(current/48)
			for p in [Vector2i(x-1,y),Vector2i(x+1,y),Vector2i(x,y-1),Vector2i(x,y+1)]:
				var key=p.y*48+p.x
				if p.x>=0 and p.x<48 and p.y>=0 and p.y<40 and pending.has(key):
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
	return {"frames":frames.size(),"fps":8,"width":frames[0].get_width(),"height":frames[0].get_height(),"loops":0}

func draw(commands,offset):
	var img=blank(48,40)
	for cmd in commands: img.fill_rect(Rect2i(int(cmd.x)+offset.x,int(cmd.y)+offset.y,int(cmd.w),int(cmd.h)),Color(str(cmd.color)))
	return img

func rect_record(rect):
	return {"x":rect.position.x,"y":rect.position.y,"width":rect.size.x,"height":rect.size.y}

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var active=root.get_node("Global").get("current_project")
	var source=str(params.source_dir)
	var output=str(params.output_dir)
	DirAccess.make_dir_recursive_absolute(output)
	var spec=JSON.parse_string(FileAccess.get_file_as_string(source.path_join("geometry.json")))
	var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"player-mop-east-review",Vector2i(48,40))
	for name in spec.sourceLayers: target.layers.append(load("res://src/Classes/Layers/PixelLayer.gd").new(target,str(name)))
	var sheets={}
	for name in ["player-with-mop","actor","actor-behind-mop","actor-in-front-of-mop","mop-overlay","skin-mask","outfit-mask","skin-layer","outfit-layer","mop-handle","mop-collar","mop-strings"]: sheets[name]=blank(432,40)
	var mats=[]
	for li in range(9): mats.append(blank(432,40))
	var originals=[]
	for li in range(9): originals.append(draw(spec.frames[0].originalRectangles[li],Vector2i(8,8)))
	var original=blend(originals)
	var frames=[]
	var cel_images=[]
	var records=[]
	var role_records=[]
	var attachments=[]
	var report={"frames":9,"layers":12,"sourceCelsExact":0,"savedCompositesExact":0,"sourceOriginalIdleExact":false,"lowerMaterialLayersExact":0,"originalHeadPixelsCompared":0,"originalHeadPixelsExact":0,"partsReconstructExact":0,"actorPartsReconstructExact":0,"palmsOnShaft":0,"palmsAboveShaft":0,"plantedFootFrames":0,"headContactY":[],"actorComponents":[],"mopComponents":[],"combinedComponents":[],"rigidMopTranslationFrames":0,"movingGripsWithHandleFrames":0,"semiTransparentPixels":0,"recolorIsolationChecks":0,"neutralChanges":0,"maskOverlapPixels":0,"paletteMismatches":0,"failures":[]}
	var playerzip=ZIPReader.new()
	if playerzip.open(source.get_base_dir().path_join("player-v3/player.pxo"))!=OK: return {"error":"Cannot inspect original player"}
	var original_exact=true
	for li in range(9):
		var saved=Image.create_from_data(16,24,false,Image.FORMAT_RGBA8,playerzip.read_file("image_data/frames/11/layer_"+str(li+1)))
		if saved.get_data()!=originals[li].get_region(Rect2i(8,8,16,24)).get_data(): original_exact=false
	playerzip.close()
	report.sourceOriginalIdleExact=original_exact
	if not original_exact: report.failures.append("Original recipe differs from actual saved source")
	for fi in range(9):
		var definition=spec.frames[fi]
		var origin=Vector2i(fi*48,0)
		var body=[]
		for li in range(9):
			var material=draw(definition.baseRectangles[li],Vector2i(8,8))
			material.blend_rect(draw(definition.armRectangles[li],Vector2i.ZERO),Rect2i(0,0,48,40),Vector2i.ZERO)
			body.append(material)
		# Original occupied cap/head pixels override arms without altering a single head pixel.
		for y in range(8,19):
			for x in range(8,24):
				if original.get_pixel(x,y).a>0:
					for li in range(9): body[li].set_pixel(x,y,originals[li].get_pixel(x,y))
		var actor=blend(body)
		for li in [0,1,2]:
			if body[li].get_data()==originals[li].get_data(): report.lowerMaterialLayersExact+=1
			else: report.failures.append("Lower material changed "+str(fi))
		for y in range(8,19):
			for x in range(8,24):
				if original.get_pixel(x,y).a>0:
					report.originalHeadPixelsCompared+=1
					if actor.get_pixel(x,y)==original.get_pixel(x,y): report.originalHeadPixelsExact+=1
		var mop_parts=[]
		for li in range(3): mop_parts.append(draw(definition.mopRectangles[li],Vector2i.ZERO))
		var mop=blend(mop_parts)
		var shifted=blank(48,40)
		var reference=blend([draw(spec.frames[0].mopRectangles[0],Vector2i.ZERO),draw(spec.frames[0].mopRectangles[1],Vector2i.ZERO),draw(spec.frames[0].mopRectangles[2],Vector2i.ZERO)])
		shifted.blit_rect(reference,Rect2i(0,0,48,40),Vector2i(int(definition.shift),0))
		if shifted.get_data()==mop.get_data(): report.rigidMopTranslationFrames+=1
		else: report.failures.append("Rigid mop shape changed "+str(fi))
		if int(definition.upperGrip.x)==int(spec.frames[0].upperGrip.x)+int(definition.shift) and int(definition.lowerGrip.x)==int(spec.frames[0].lowerGrip.x)+int(definition.shift): report.movingGripsWithHandleFrames+=1
		else: report.failures.append("Grip sliding on shaft "+str(fi))
		var actor_front=blank(48,40)
		var actor_back=blank(48,40)
		for y in range(40):
			for x in range(48):
				var near_grip=false
				for grip in [definition.upperGrip,definition.lowerGrip]:
					if abs(x-int(grip.x))<=1 and abs(y-int(grip.y))<=1: near_grip=true
				if near_grip or mop.get_pixel(x,y).a>0: actor_front.set_pixel(x,y,actor.get_pixel(x,y))
				else: actor_back.set_pixel(x,y,actor.get_pixel(x,y))
		var images=mop_parts.duplicate()
		images.append_array(body)
		var combined=blend(images)
		if blend([actor_back,mop,actor_front]).get_data()==combined.get_data(): report.partsReconstructExact+=1
		else: report.failures.append("Parts reconstruction "+str(fi))
		if blend([actor_back,actor_front]).get_data()==actor.get_data(): report.actorPartsReconstructExact+=1
		for grip in [definition.upperGrip,definition.lowerGrip]:
			var p=Vector2i(int(grip.x),int(grip.y))
			if mop_parts[0].get_pixel(p.x,p.y).a>0 and body[4].get_pixel(p.x,p.y).a>0: report.palmsOnShaft+=1
			else: report.failures.append("Palm misses shaft "+str(fi))
			if combined.get_pixel(p.x,p.y)==body[4].get_pixel(p.x,p.y) and actor_front.get_pixel(p.x,p.y).a>0: report.palmsAboveShaft+=1
			else: report.failures.append("Wood obscures palm "+str(fi))
		if body[1].get_pixel(16,31).a>0: report.plantedFootFrames+=1
		var max_y=-1
		for y in range(40):
			for x in range(48):
				if mop_parts[2].get_pixel(x,y).a>0: max_y=max(max_y,y)
		report.headContactY.append(max_y)
		if max_y!=31: report.failures.append("Mop lifted off floor "+str(fi))
		report.actorComponents.append(components(actor))
		report.mopComponents.append(components(mop))
		report.combinedComponents.append(components(combined))
		var frame=load("res://src/Classes/Frame.gd").new()
		frame.duration=definition.durationMultiplier
		for li in range(12): frame.cels.append(target.layers[li].new_cel_from_image(images[li]))
		target.frames.append(frame)
		cel_images.append(images)
		frames.append(combined)
		for pair in [["player-with-mop",combined],["actor",actor],["actor-behind-mop",actor_back],["actor-in-front-of-mop",actor_front],["mop-overlay",mop],["mop-handle",mop_parts[0]],["mop-collar",mop_parts[1]],["mop-strings",mop_parts[2]]]: sheets[pair[0]].blit_rect(pair[1],Rect2i(0,0,48,40),origin)
		for li in range(9): mats[li].blit_rect(body[li],Rect2i(0,0,48,40),origin)
		var role_record={"index":fi,"sheetRect":rect_record(Rect2i(origin,Vector2i(48,40))),"roles":{}}
		for name in ["skin","outfit"]:
			var role=spec.roles[name]
			var material=body[int(role.layer)]
			var mask=blank(48,40)
			var tones={}
			for tone in role.tones: tones[tone]=[]
			var recolored=combined.duplicate()
			var eligible=0
			for y in range(40):
				for x in range(48):
					var color=combined.get_pixel(x,y)
					for tone in role.tones:
						if color.a>0 and color==Color(str(role.tones[tone])) and material.get_pixel(x,y)==color:
							mask.set_pixel(x,y,Color.WHITE)
							tones[tone].append([x,y])
							recolored.set_pixel(x,y,Color("#19e6c4"))
							eligible+=1
			var changed=0
			for y in range(40):
				for x in range(48):
					if recolored.get_pixel(x,y)!=combined.get_pixel(x,y):
						changed+=1
						if mask.get_pixel(x,y).a==0: report.neutralChanges+=1
			if changed!=eligible: report.failures.append("Recolor mismatch")
			report.recolorIsolationChecks+=1
			sheets[name+"-mask"].blit_rect(mask,Rect2i(0,0,48,40),origin)
			sheets[name+"-layer"].blit_rect(material,Rect2i(0,0,48,40),origin)
			role_record.roles[name]={"visibleTonePixels":tones}
		role_records.append(role_record)
		records.append({"index":fi,"direction":"east","state":definition.state,"step":definition.step,"x":fi*48,"y":0,"width":48,"height":40,"durationMs":definition.durationMs,"durationMultiplier":frame.duration})
		attachments.append({"index":fi,"direction":"east","state":definition.state,"footAnchor":spec.footAnchor,"upperGrip":definition.upperGrip,"lowerGrip":definition.lowerGrip,"upperElbow":definition.upperElbow,"lowerElbow":definition.lowerElbow,"handleTop":definition.handleTop,"collar":definition.collar,"mopHeadContact":definition.mopHeadContact,"mopHeadBounds":definition.mopHeadBounds,"mopMotionOffset":{"x":definition.shift,"y":0}})
		for y in range(40):
			for x in range(48):
				var color=combined.get_pixel(x,y)
				if color.a!=0 and color.a!=1: report.semiTransparentPixels+=1
				if color.a>0 and not spec.palette.has("#"+color.to_html(false)): report.paletteMismatches+=1
	target.fps=8
	target.current_frame=0
	target.current_layer=0
	var pal=load("res://src/Palette/Palette.gd").new("Mop worker - actor17 wood2",10,2,"Original actor materials plus two separate wood tones")
	pal.is_project_palette=true
	for color in spec.palette: pal.add_color(Color(str(color)))
	target.palettes[pal.name]=pal
	target.project_current_palette_name=pal.name
	target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new("hold_east",Color("#ee75a3"),1,1))
	target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new("mop_east",Color("#a6bcb2"),2,9))
	if not root.get_node("OpenSave").call("save_pxo_file",source.path_join("player-mop-east.pxo"),false,target): return {"error":"Native save failed"}
	var zip=ZIPReader.new()
	if zip.open(source.path_join("player-mop-east.pxo"))!=OK: return {"error":"Cannot inspect saved PXO"}
	var data=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	report.savedDimensions=[data.size_x,data.size_y]
	report.savedTags=data.tags
	report.sourceFps=data.fps
	report.savedLayerNames=[]
	for layer in data.layers: report.savedLayerNames.append(layer.name)
	if report.savedLayerNames!=spec.sourceLayers: report.failures.append("Saved layer names differ")
	report.paletteSwatches=JSON.parse_string(data.palettes[0].values()[0]).colors.size()
	if int(data.size_x)!=48 or int(data.size_y)!=40 or data.frames.size()!=9 or data.layers.size()!=12 or data.tags.size()!=2 or int(data.fps)!=8 or report.paletteSwatches!=19: report.failures.append("Saved source metadata mismatch")
	for tag in [[0,"hold_east",1,1],[1,"mop_east",2,9]]:
		if str(data.tags[tag[0]].name)!=tag[1] or int(data.tags[tag[0]].from)!=tag[2] or int(data.tags[tag[0]].to)!=tag[3]: report.failures.append("Saved animation tag differs")
	for fi in range(9):
		if int(data.frames[fi].duration)!=(4 if fi==0 else 1): report.failures.append("Saved timing differs")
		var rebuilt=[]
		for li in range(12):
			var bytes=zip.read_file("image_data/frames/"+str(fi+1)+"/layer_"+str(li+1))
			if bytes==cel_images[fi][li].get_data(): report.sourceCelsExact+=1
			else: report.failures.append("Saved cel differs")
			rebuilt.append(Image.create_from_data(48,40,false,Image.FORMAT_RGBA8,bytes))
		if blend(rebuilt).get_data()==frames[fi].get_data(): report.savedCompositesExact+=1
		else: report.failures.append("Saved composite differs")
	zip.close()
	for name in sheets: sheets[name].save_png(output.path_join(name+".png"))
	for li in range(9): mats[li].save_png(output.path_join("material-"+str(li)+".png"))
	for y in range(40):
		for x in range(432):
			if sheets["skin-mask"].get_pixel(x,y).a>0 and sheets["outfit-mask"].get_pixel(x,y).a>0: report.maskOverlapPixels+=1
	var motion=[]
	for fi in range(1,9):
		var enlarged=frames[fi].duplicate()
		enlarged.resize(384,320,Image.INTERPOLATE_NEAREST)
		motion.append(enlarged)
	for directory in [source,output]:
		save_preview(frames[0],directory.path_join("hold-east-preview.png"),8)
		report.motion=save_apng(motion,directory.path_join("mop-east-motion-preview.png"))
		var storyboard=blank(240,80)
		for fi in range(9): storyboard.blit_rect(frames[fi],Rect2i(0,0,48,40),Vector2i((fi%5)*48,int(fi/5)*40))
		save_preview(storyboard,directory.path_join("mop-east-frames-preview.png"),4)
	frames[0].save_png(output.path_join("hold-east.png"))
	var native_motion=[]
	for fi in range(1,9): native_motion.append(frames[fi])
	save_apng(native_motion,output.path_join("mop-east-native.png"))
	var floor=Image.load_from_file(source.get_base_dir().get_base_dir().get_base_dir().path_join("apps/web/public/art/front-of-house-v1/floor-checker.png"))
	var context_frames=[]
	for fi in range(9):
		var context=blank(48,40)
		for y in range(0,40,floor.get_height()):
			for x in range(0,48,floor.get_width()): context.blit_rect(floor,Rect2i(0,0,floor.get_width(),floor.get_height()),Vector2i(x,y))
		context.blend_rect(frames[fi],Rect2i(0,0,48,40),Vector2i.ZERO)
		context.resize(384,320,Image.INTERPOLATE_NEAREST)
		if fi==0:
			for directory in [source,output]: context.save_png(directory.path_join("hold-east-floor-preview.png"))
		else: context_frames.append(context)
	for directory in [source,output]: save_apng(context_frames,directory.path_join("mop-east-floor-preview.png"))
	var unique=[]
	for fi in range(1,9):
		if not unique.has(frames[fi].get_data()): unique.append(frames[fi].get_data())
	report.distinctMotionPoses=unique.size()
	if report.actorComponents.any(func(value): return value!=1) or report.mopComponents.any(func(value): return value!=1) or report.combinedComponents.any(func(value): return value!=1): report.failures.append("Detached actor/mop pixels")
	if report.originalHeadPixelsCompared!=report.originalHeadPixelsExact: report.failures.append("Head changed")
	if report.semiTransparentPixels!=0 or report.paletteMismatches!=0 or report.maskOverlapPixels!=0 or report.neutralChanges!=0: report.failures.append("Pixel/mask isolation failed")
	var animations={"hold_east":{"frames":[0],"fps":2},"mop_east":{"frames":[1,2,3,4,5,6,7,8],"fps":8,"loopDurationMs":1000}}
	for directory in [source,output]: write_json(directory.path_join("attachments.json"),{"frameSize":spec.frameSize,"bodyOffset":spec.bodyOffset,"bodySize":spec.bodySize,"footAnchor":spec.footAnchor,"gripOrder":"upper grip y20, lower grip y24; both move with rigid handle","drawOrder":["actor-behind-mop.png","mop-overlay.png","actor-in-front-of-mop.png"],"floorContactY":31,"frames":attachments})
	write_json(source.path_join("frame-records.json"),records)
	write_json(output.path_join("recolor-map.json"),{"frameSize":spec.frameSize,"sheetSize":spec.sheetSize,"roles":spec.roles,"layerIndexing":"roles.layer is zero-based actor material index; native source layer is roles.layer + 3","frames":role_records,"neutralPixelsExcluded":true})
	write_json(output.path_join("manifest.json"),{"status":"east-only-art-review","frameSize":spec.frameSize,"sheetSize":spec.sheetSize,"bodySize":spec.bodySize,"bodyOffset":spec.bodyOffset,"footAnchor":spec.footAnchor,"direction":"east","source":"assets/pixelorama/player-mop-east-review/player-mop-east.pxo","sourceLayers":spec.sourceLayers,"actorMaterialLayers":spec.bodyLayers,"palette":"palette.json","parts":{"actorBehind":"actor-behind-mop.png","mopOverlay":"mop-overlay.png","actorForeground":"actor-in-front-of-mop.png","actorComplete":"actor.png","combined":"player-with-mop.png","woodenHandle":"mop-handle.png","chromeCollar":"mop-collar.png","stringHead":"mop-strings.png"},"drawOrder":["actorBehind","mopOverlay","actorForeground"],"preview":"mop-east-motion-preview.png","idlePreview":"hold-east-preview.png","attachments":"attachments.json","recolorMap":"recolor-map.json","frameIndexing":"zero-based public frames; one-based Pixelorama tags","fps":8,"frameRecords":records,"animations":animations,"engineLogicImplemented":false})
	report.activeProjectUnchanged=root.get_node("Global").get("current_project")==active
	write_json(source.path_join("verification.json"),report)
	return report


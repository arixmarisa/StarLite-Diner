func blank(width,height):
	var out=Image.create(width,height,false,Image.FORMAT_RGBA8)
	out.fill(Color(0,0,0,0))
	return out

func blend(images):
	var out=blank(16,24)
	for img in images:
		out.blend_rect(img,Rect2i(0,0,16,24),Vector2i.ZERO)
	return out

func be32(value):
	return PackedByteArray([(int(value)>>24)&255,(int(value)>>16)&255,(int(value)>>8)&255,int(value)&255])

func be16(value):
	return PackedByteArray([(int(value)>>8)&255,int(value)&255])

func read32(data, offset):
	return (int(data[offset])<<24)|(int(data[offset+1])<<16)|(int(data[offset+2])<<8)|int(data[offset+3])

func crc32(data):
	var crc=0xffffffff
	for byte in data:
		crc=crc^int(byte)
		for bit in range(8):
			crc=(crc>>1)^0xedb88320 if (crc&1)!=0 else crc>>1
	return (crc^0xffffffff)&0xffffffff

func chunk(kind,payload):
	var data=kind.to_ascii_buffer()
	data.append_array(payload)
	var out=be32(payload.size())
	out.append_array(data)
	out.append_array(be32(crc32(data)))
	return out

func png_parts(image):
	var png=image.save_png_to_buffer()
	var cursor=8
	var header=PackedByteArray()
	var compressed=PackedByteArray()
	while cursor<png.size():
		var length=read32(png,cursor)
		var kind=png.slice(cursor+4,cursor+8).get_string_from_ascii()
		var body=png.slice(cursor+8,cursor+8+length)
		if kind=="IHDR":
			header=body
		elif kind=="IDAT":
			compressed.append_array(body)
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
	for frame_index in range(frames.size()):
		var data=be32(sequence)
		sequence+=1
		data.append_array(be32(frames[frame_index].get_width()))
		data.append_array(be32(frames[frame_index].get_height()))
		data.append_array(be32(0))
		data.append_array(be32(0))
		data.append_array(be16(1))
		data.append_array(be16(8))
		data.append(0)
		data.append(0)
		output.append_array(chunk("fcTL",data))
		var content=first if frame_index==0 else png_parts(frames[frame_index])
		if frame_index==0:
			output.append_array(chunk("IDAT",content.compressed))
		else:
			var animation_data=be32(sequence)
			sequence+=1
			animation_data.append_array(content.compressed)
			output.append_array(chunk("fdAT",animation_data))
	output.append_array(chunk("IEND",PackedByteArray()))
	var file=FileAccess.open(path,FileAccess.WRITE)
	if file==null:
		return {"error":"Cannot write APNG"}
	file.store_buffer(output)
	file.close()
	return {"frames":frames.size(),"width":frames[0].get_width(),"height":frames[0].get_height(),"fps":8,"loops":0,"bytes":output.size()}

func holes_of(image):
	var seen={}
	var queue=[]
	var bounds=Rect2i(0,0,16,24)
	for x in range(16):
		for y in [0,23]:
			if image.get_pixel(x,y).a==0:
				queue.append(Vector2i(x,y))
	for y in range(24):
		for x in [0,15]:
			if image.get_pixel(x,y).a==0:
				queue.append(Vector2i(x,y))
	while queue.size()>0:
		var point=queue.pop_back()
		var key=str(point.x)+","+str(point.y)
		if seen.has(key):
			continue
		seen[key]=true
		for delta in [Vector2i(-1,0),Vector2i(1,0),Vector2i(0,-1),Vector2i(0,1)]:
			var next=point+delta
			var next_key=str(next.x)+","+str(next.y)
			if bounds.has_point(next) and image.get_pixelv(next).a==0 and not seen.has(next_key):
				queue.append(next)
	var holes=[]
	for y in range(24):
		for x in range(16):
			if image.get_pixel(x,y).a==0 and not seen.has(str(x)+","+str(y)):
				holes.append([x,y])
	return holes

func opaque_component_count(image):
	var seen={}
	var count=0
	for y in range(24):
		for x in range(16):
			var seed=Vector2i(x,y)
			if image.get_pixel(x,y).a==0 or seen.has(str(seed)):
				continue
			count+=1
			var queue=[seed]
			while queue.size()>0:
				var point=queue.pop_back()
				if seen.has(str(point)):
					continue
				seen[str(point)]=true
				for delta in [Vector2i(-1,0),Vector2i(1,0),Vector2i(0,-1),Vector2i(0,1)]:
					var next=point+delta
					if Rect2i(0,0,16,24).has_point(next) and image.get_pixelv(next).a>0 and not seen.has(str(next)):
						queue.append(next)
	return count

func run(api,image,project,params):
	var source_dir=str(params.source_dir)
	var output_dir=str(params.output_dir)
	var spec=JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("geometry.json")))
	var zip=ZIPReader.new()
	if zip.open(source_dir.path_join("player.pxo"))!=OK:
		return {"error":"Cannot read saved native source"}
	var data=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	if data.size_x!=16 or data.size_y!=24 or data.layers.size()!=9 or data.frames.size()!=40 or data.tags.size()!=16:
		return {"error":"Wrong native dimensions/layers/frame/tag count"}
	var sheet=Image.load_from_file(output_dir.path_join("player.png"))
	var atlas=Image.load_from_file(output_dir.path_join("player-atlas.png"))
	var approved=Image.load_from_file(str(params.approved_front))
	var masks={"skin":Image.load_from_file(output_dir.path_join("skin-mask.png")),"outfit":Image.load_from_file(output_dir.path_join("outfit-mask.png"))}
	var skin_mask=masks["skin"]
	var outfit_mask=masks["outfit"]
	var source_frames=[]
	var source_images=[]
	var records=[]
	var all_source_match=true
	var all_connected=true
	var timing_exact=int(data.get("fps",0))==8
	var all_masks_disjoint=true
	var all_isolated=true
	var all_roles_exclusive=true
	var all_anchors=true
	var all_shadows=true
	var all_shoes_grounded=true
	var opaque_total=0
	var semi_total=0
	var orphan_total=0
	var palette_colors={}
	for frame_index in range(40):
		var images=[]
		var cel_lengths=[]
		for layer_index in range(9):
			var raw=zip.read_file("image_data/frames/"+str(frame_index+1)+"/layer_"+str(layer_index+1))
			cel_lengths.append(raw.size())
			if raw.size()!=1536:
				return {"error":"Invalid saved cel byte count","frame":frame_index,"layer":layer_index}
			images.append(Image.create_from_data(16,24,false,Image.FORMAT_RGBA8,raw))
		var composite=blend(images)
		var component_count=opaque_component_count(composite)
		all_connected=all_connected and component_count==1
		timing_exact=timing_exact and int(data.frames[frame_index].duration)==(4 if frame_index%5==0 else 1)
		source_frames.append(composite)
		source_images.append(images)
		var row=int(frame_index/5)
		var column=frame_index%5
		var origin=Vector2i(column*16,row*24)
		var grounded_shoe_pixels=0
		var shoes=images[1]
		for x in range(16):
			if shoes.get_pixel(x,23).a>0:
				grounded_shoe_pixels+=1
		all_shoes_grounded=all_shoes_grounded and grounded_shoe_pixels>0
		var frame_exact=composite.get_data()==sheet.get_region(Rect2i(origin,Vector2i(16,24))).get_data()
		all_source_match=all_source_match and frame_exact
		all_anchors=all_anchors and composite.get_pixel(8,23).a==1
		all_shadows=all_shadows and images[0].get_data()==source_images[0][0].get_data()
		var roles={}
		var mask_overlap=0
		for y in range(24):
			for x in range(16):
				var color=composite.get_pixel(x,y)
				if color.a==1:
					opaque_total+=1
					palette_colors[color.to_html()]=true
					var neighbor=false
					for delta in [Vector2i(-1,0),Vector2i(1,0),Vector2i(0,-1),Vector2i(0,1)]:
						var at=Vector2i(x,y)+delta
						if Rect2i(0,0,16,24).has_point(at) and composite.get_pixelv(at).a>0:
							neighbor=true
					if not neighbor:
						orphan_total+=1
				elif color.a!=0:
					semi_total+=1
				if skin_mask.get_pixel(x+origin.x,y+origin.y).a>0 and outfit_mask.get_pixel(x+origin.x,y+origin.y).a>0:
					mask_overlap+=1
		all_masks_disjoint=all_masks_disjoint and mask_overlap==0
		for role_name in ["skin","outfit"]:
			var definition=spec.roles[role_name]
			var layer_index=int(definition.layer)
			var tones=[]
			for tone in definition.tones:
				tones.append(Color(str(definition.tones[tone])))
			var recolored=images[layer_index].duplicate()
			var restricted=true
			var eligible_count=0
			for y in range(24):
				for x in range(16):
					var color=recolored.get_pixel(x,y)
					if color.a>0 and tones.has(color):
						recolored.set_pixel(x,y,Color("#20b8b0") if role_name=="skin" else Color("#7b85dd"))
					if masks[role_name].get_pixel(x+origin.x,y+origin.y).a>0:
						eligible_count+=1
					for other in range(9):
						if other!=layer_index:
							var other_color=images[other].get_pixel(x,y)
							if other_color.a>0 and tones.has(other_color):
								restricted=false
			var changed_layers=images.duplicate()
			changed_layers[layer_index]=recolored
			var changed_composite=blend(changed_layers)
			var outside=0
			var changed=0
			for y in range(24):
				for x in range(16):
					if changed_composite.get_pixel(x,y)!=composite.get_pixel(x,y):
						changed+=1
						if masks[role_name].get_pixel(x+origin.x,y+origin.y).a==0:
							outside+=1
			roles[role_name]={"eligiblePixels":eligible_count,"changedPixels":changed,"changedOutsideMask":outside,"tonesRestrictedToRoleLayer":restricted}
			all_isolated=all_isolated and outside==0 and changed==eligible_count
			all_roles_exclusive=all_roles_exclusive and restricted
		var rect=composite.get_used_rect()
		records.append({"index":frame_index,"direction":spec.rowOrder[row],"step":column,"sourceMatchesSheet":frame_exact,"celByteSizes":cel_lengths,"occupiedBounds":{"x":rect.position.x,"y":rect.position.y,"width":rect.size.x,"height":rect.size.y},"maskOverlap":mask_overlap,"opaqueConnectedComponents":component_count,"groundedShoePixels":grounded_shoe_pixels,"durationMultiplier":data.frames[frame_index].duration,"roles":roles,"intentionalTransparentClearancePixels":holes_of(composite)})
	var distinct_walk={}
	for row in range(8):
		var hashes={}
		for step in range(1,5):
			hashes[source_frames[row*5+step].get_data().hex_encode()]=true
		distinct_walk[spec.rowOrder[row]]=hashes.size()
	var motion_frames=[]
	for step in range(1,5):
		var strip=blank(128,24)
		for row in range(8):
			strip.blit_rect(source_frames[row*5+step],Rect2i(0,0,16,24),Vector2i(row*16,0))
		strip.resize(768,144,Image.INTERPOLATE_NEAREST)
		motion_frames.append(strip)
	var motion=save_apng(motion_frames,source_dir.path_join("player-motion-preview.png"))
	motion.runtimeCopyCode=DirAccess.copy_absolute(source_dir.path_join("player-motion-preview.png"),output_dir.path_join("player-motion-preview.png"))
	var diagonal_idles=blank(64,24)
	for row in range(4):
		diagonal_idles.blit_rect(source_frames[(row+4)*5],Rect2i(0,0,16,24),Vector2i(row*16,0))
	diagonal_idles.save_png(output_dir.path_join("diagonal-idles.png"))
	diagonal_idles.resize(512,192,Image.INTERPOLATE_NEAREST)
	diagonal_idles.save_png(source_dir.path_join("diagonal-idles-preview.png"))
	diagonal_idles.save_png(output_dir.path_join("diagonal-idles-preview.png"))
	var diagonal_motion_frames=[]
	for step in range(1,5):
		var strip=blank(64,24)
		for row in range(4):
			strip.blit_rect(source_frames[(row+4)*5+step],Rect2i(0,0,16,24),Vector2i(row*16,0))
		strip.resize(384,144,Image.INTERPOLATE_NEAREST)
		diagonal_motion_frames.append(strip)
	var diagonal_motion=save_apng(diagonal_motion_frames,source_dir.path_join("diagonal-motion-preview.png"))
	DirAccess.copy_absolute(source_dir.path_join("diagonal-motion-preview.png"),output_dir.path_join("diagonal-motion-preview.png"))
	var palette_data=JSON.parse_string(data.palettes[0].values()[0])
	var previous_sheet=Image.load_from_file(str(params.cardinal_sheet))
	var cardinal_exact=sheet.get_region(Rect2i(0,0,80,96)).get_data()==previous_sheet.get_data()
	var report={"allOriginalCardinalFramesExact":cardinal_exact,"sourceSize":[data.size_x,data.size_y],"sourceFrames":data.frames.size(),"sourceLayers":data.layers.size(),"sourceTags":data.tags,"paletteSwatches":palette_data.colors.size(),"allSavedFramesMatchSheet":all_source_match,"allSpritesOneConnectedOpaqueComponent":all_connected,"nativeTimelineTimingExact":timing_exact,"sourceFps":data.get("fps",0),"sheetMatchesAtlas":sheet.get_data()==atlas.get_data(),"approvedSouthIdleExact":source_frames[0].get_data()==approved.get_data(),"allGroundAnchorsOpaque":all_anchors,"allContactShadowsIdentical":all_shadows,"allFramesHaveGroundedShoe":all_shoes_grounded,"allRoleMasksDisjoint":all_masks_disjoint,"allRecolorChangesRestrictedToMasks":all_isolated,"allRoleTonesRestrictedToTheirLayers":all_roles_exclusive,"distinctWalkFramesPerDirection":distinct_walk,"opaquePixelsAcrossFrames":opaque_total,"semitransparentPixelsAcrossFrames":semi_total,"orphanPixelsAcrossFrames":orphan_total,"visibleColorsAcrossFrames":palette_colors.size(),"motion":motion,"frameChecks":records}
	zip.close()
	var report_file=FileAccess.open(source_dir.path_join("verification.json"),FileAccess.WRITE)
	report_file.store_string(JSON.stringify(report,"  "))
	report_file.close()
	return {"allOriginalCardinalFramesExact":cardinal_exact,"savedCels":360,"sourceFrames":report.sourceFrames,"sourceLayers":report.sourceLayers,"sourceTags":data.tags.size(),"paletteSwatches":report.paletteSwatches,"sourcePixelsExact":all_source_match,"allSpritesConnected":all_connected,"nativeTimelineTimingExact":timing_exact,"atlasPixelsExact":report.sheetMatchesAtlas,"approvedFrontExact":report.approvedSouthIdleExact,"anchorsStable":all_anchors,"shadowsStable":all_shadows,"allFramesHaveGroundedShoe":all_shoes_grounded,"recolorIsolated":all_isolated,"rolePaletteExclusive":all_roles_exclusive,"masksDisjoint":all_masks_disjoint,"distinctWalkFrames":distinct_walk,"opaquePixels":opaque_total,"semiPixels":semi_total,"orphanPixels":orphan_total,"visibleColors":palette_colors.size(),"motion":motion}

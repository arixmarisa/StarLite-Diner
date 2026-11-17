func blank(w,h):
	var out=Image.create(w,h,false,Image.FORMAT_RGBA8)
	out.fill(Color(0,0,0,0))
	return out

func paint(groups,ramps,spec):
	var composite=blank(16,24)
	for li in range(10):
		var layer=blank(16,24)
		for group in ["shadow","shoes","bottom","head","top"]:
			for command in groups[group][li]:
				var token=str(command.c)
				var color=Color(0,0,0,0)
				if token!="clear":
					if token.contains("."):
						var parts=token.split(".")
						color=Color(ramps[parts[0]][parts[1]])
					else: color=Color(spec.fixedColors[token])
				layer.fill_rect(Rect2i(command.x,command.y,command.w,command.h),color)
		composite.blend_rect(layer,Rect2i(0,0,16,24),Vector2i.ZERO)
	return composite

func count_components(img):
	var remaining={}
	for y in range(24):
		for x in range(16):
			if img.get_pixel(x,y).a>0: remaining[y*16+x]=true
	var count=0
	while not remaining.is_empty():
		count+=1
		var queue=[remaining.keys()[0]]
		remaining.erase(queue[0])
		while not queue.is_empty():
			var p=int(queue.pop_back())
			for offset in [Vector2i(-1,0),Vector2i(1,0),Vector2i(0,-1),Vector2i(0,1)]:
				var q=Vector2i(p%16,p/16)+offset
				var key=q.y*16+q.x
				if Rect2i(0,0,16,24).has_point(q) and remaining.has(key):
					remaining.erase(key)
					queue.append(key)
	return count

func run(api,image,project,params):
	var source=str(params.source_dir)
	var output=str(params.output_dir)
	var spec=JSON.parse_string(FileAccess.get_file_as_string(source.path_join("contract.json")))
	var parts=JSON.parse_string(FileAccess.get_file_as_string(source.path_join("part-selection.json")))
	var report={"originalPartReassembliesExact":0,"crossOutfitAssembliesChecked":0,"failures":[],"skinRampFollowsHead":true,"visibleExtraVariantsExported":0}
	for family in ["male","female"]:
		var sheet=Image.load_from_file(output.path_join(family+".png"))
		var recipe=JSON.parse_string(FileAccess.get_file_as_string(source.path_join(family+"-frames.json")))
		var indexed={}
		for part in parts.frames:
			if part.base==family: indexed[part.id]=part
		for variant in recipe.variants:
			for frame in variant.frames:
				var part=indexed[frame.id]
				var rendered=paint(part.groups,part.ramps,spec)
				var reference=sheet.get_region(Rect2i(frame.sheet.x,frame.sheet.y,16,24))
				if rendered.get_data()!=reference.get_data(): report.failures.append("Part reassembly mismatch: "+frame.id)
				else: report.originalPartReassembliesExact+=1
		for direction in spec.directions:
			for pose in ["idle","walk-1","walk-2","walk-3","walk-4","seated"]:
				for choices in [[0,1,2],[2,0,1]]:
					var head=indexed[recipe.variants[choices[0]].id+"-"+direction+"-"+pose]
					var top=indexed[recipe.variants[choices[1]].id+"-"+direction+"-"+pose]
					var bottom=indexed[recipe.variants[choices[2]].id+"-"+direction+"-"+pose]
					var groups={"head":head.groups.head,"top":top.groups.top,"bottom":bottom.groups.bottom,"shoes":top.groups.shoes,"shadow":head.groups.shadow}
					var ramps={"skin":head.ramps.skin,"hair":head.ramps.hair,"top":top.ramps.top,"secondary":top.ramps.secondary,"bottom":bottom.ramps.bottom,"shoes":top.ramps.shoes}
					var composite=paint(groups,ramps,spec)
					if count_components(composite)!=1: report.failures.append("Disconnected mix: "+family+"-"+direction+"-"+pose)
					report.crossOutfitAssembliesChecked+=1
	var file=FileAccess.open(source.path_join("part-verification.json"),FileAccess.WRITE)
	file.store_string(JSON.stringify(report,"  "))
	file.close()
	return report

const SIZE = Vector2i(160, 160)
const PROJECT_NAME = "kitchen-counter-kit"
const LAYERS = ["01 - steel worktop planes", "02 - steel cabinet faces and plinths", "03 - chrome edges and plum contours", "04 - handles and rose hardware accents"]

func steel(color):
	if color.a == 0.0:
		return Color(0, 0, 0, 0)
	var swaps = {"fff5df":"d5dfd3", "fff0d5":"d5dfd3", "f1e5d1":"9ba8a5", "a6bcb2":"9ba8a5", "ee75a3":"9ba8a5", "c94d7b":"676c70", "9f385e":"322c38", "ffacc9":"d5dfd3", "ffd2de":"d5dfd3"}
	var hex = color.to_html(false)
	return Color("#" + swaps.get(hex, hex))

func steel_image(source):
	var result = Image.create(source.get_width(), source.get_height(), false, Image.FORMAT_RGBA8)
	result.fill(Color(0,0,0,0))
	for y in range(source.get_height()):
		for x in range(source.get_width()):
			result.set_pixel(x,y,steel(source.get_pixel(x,y)))
	return result

func put(image, x, y, color):
	if x >= 0 and y >= 0 and x < image.get_width() and y < image.get_height():
		image.set_pixel(x,y,Color(color))

func hardware(image, top):
	var width = image.get_width()
	var panel_count = 2 if width == 32 else 1
	for panel in range(panel_count):
		var center = 8 + panel * 16 if width != 24 else 12
		for x in range(center - 3, center + 3):
			put(image,x,top+7,"#676c70")
		for x in range(center - 2, center + 2):
			put(image,x,top+7,"#d5dfd3")
		put(image,center+5,top+5,"#c94d7b")
		put(image,center+5,top+6,"#ffacc9")

func blend(target, indices):
	var output = Image.create(SIZE.x,SIZE.y,false,Image.FORMAT_RGBA8)
	output.fill(Color(0,0,0,0))
	for index in indices:
		output.blend_rect(target.frames[0].cels[index].get_image(),Rect2i(Vector2i.ZERO,SIZE),Vector2i.ZERO)
	return output

func target_project():
	var matches=[]
	for candidate in Engine.get_main_loop().root.get_node("Global").get("projects"):
		if candidate.name == PROJECT_NAME and candidate.size == SIZE:
			matches.append(candidate)
	return matches[0] if matches.size()==1 else null

func source_path(base, spec):
	if spec.begins_with("front/"):
		return base.path_join("apps/web/public/art/front-of-house-v1/" + spec.trim_prefix("front/"))
	return base.path_join("apps/web/public/art/counter-side-review/" + spec.trim_prefix("side/"))

func run(api, image, project, params):
	var target = target_project()
	if target == null:
		return {"error":"Expected one unambiguous kitchen-counter-kit160x160 project"}
	var active_before=Engine.get_main_loop().root.get_node("Global").get("current_project")
	var initializing=target.layers.size()==1 and target.frames[0].cels[0].get_image().get_used_rect().size==Vector2i.ZERO
	if not initializing:
		if target.layers.size()!=LAYERS.size():
			return {"error":"Target layer count mismatch before drawing"}
		for i in range(LAYERS.size()):
			if target.layers[i].name!=LAYERS[i]:
				return {"error":"Target layer names mismatch before drawing"}
	var role_images=[]
	for i in range(4):
		var output=Image.create(SIZE.x,SIZE.y,false,Image.FORMAT_RGBA8)
		output.fill(Color(0,0,0,0))
		role_images.append(output)
	var pieces={}
	var handles={}
	var top_reference=steel_image(Image.load_from_file(str(params.repo).path_join("apps/web/public/art/front-of-house-v1/counter-top.png")))
	var face_reference=steel_image(Image.load_from_file(str(params.repo).path_join("apps/web/public/art/front-of-house-v1/counter-front.png")))
	var vertical_reference=steel_image(Image.load_from_file(str(params.repo).path_join("apps/web/public/art/front-of-house-v1/counter-vertical.png")))
	for item in params.modules:
		if str(item.source).begins_with("derived"):
			continue
		var original=null
		if str(item.source).begins_with("generated"):
			original=Image.create(24,24,false,Image.FORMAT_RGBA8)
			for y in range(24):
				for x in range(24):
					var use_horizontal=(x>=y) if str(item.source)=="generated-east-south" else (x+y<=23)
					var color=top_reference.get_pixel(8,y) if use_horizontal else vertical_reference.get_pixel(x,8)
					original.set_pixel(x,y,color)
		else:
			original=Image.load_from_file(source_path(str(params.repo),str(item.source)))
		if original==null or original.get_size()!=Vector2i(int(item.rect[2]),int(item.rect[3])):
			return {"error":"Reference dimensions mismatch","asset":item.id}
		var converted=steel_image(original)
		if item.id=="steel-counter-end-left" or item.id=="steel-counter-end-right":
			var begin=2 if item.id=="steel-counter-end-left" else 0
			var end=16 if item.id=="steel-counter-end-left" else 14
			for y in range(40):
				for x in range(begin,end):
					converted.set_pixel(x,y,top_reference.get_pixel(8,y) if y<24 else face_reference.get_pixel(x,y-24))
		pieces[item.id]=converted
		var details=Image.create(converted.get_width(),converted.get_height(),false,Image.FORMAT_RGBA8)
		details.fill(Color(0,0,0,0))
		if bool(item.face):
			hardware(details,int(item.surfaceHeight))
		handles[item.id]=details
	var front=pieces["steel-counter-front"].duplicate()
	front.blend_rect(handles["steel-counter-front"],Rect2i(0,0,16,16),Vector2i.ZERO)
	pieces["steel-counter-lip-front"]=front.get_region(Rect2i(0,0,16,4))
	pieces["steel-counter-lip-side"]=pieces["steel-counter-vertical-top"].get_region(Rect2i(20,0,4,16))
	for item in params.modules:
		var piece=pieces[item.id]
		var pos=Vector2i(int(item.rect[0]),int(item.rect[1]))
		for y in range(piece.get_height()):
			for x in range(piece.get_width()):
				var color=piece.get_pixel(x,y)
				if color.a==0.0:
					continue
				var hex=color.to_html(false)
				var role=0 if y<int(item.surfaceHeight) else 1
				if hex=="322c38" or hex=="676c70" or hex=="d5dfd3":
					role=2
				role_images[role].set_pixel(pos.x+x,pos.y+y,color)
		if handles.has(item.id):
			role_images[3].blend_rect(handles[item.id],Rect2i(Vector2i.ZERO,piece.get_size()),pos)
	if initializing:
		target.layers[0].name=LAYERS[0]
		target.frames[0].cels[0]=target.layers[0].new_cel_from_image(role_images[0])
		var layer_script=target.layers[0].get_script()
		for i in range(1,4):
			var layer=layer_script.new(target,LAYERS[i])
			target.layers.append(layer)
			target.frames[0].cels.append(layer.new_cel_from_image(role_images[i]))
	else:
		for i in range(4):
			target.frames[0].cels[i]=target.layers[i].new_cel_from_image(role_images[i])
	var template_palette=null
	var template_tag=null
	for candidate in Engine.get_main_loop().root.get_node("Global").get("projects"):
		if candidate.name=="back-grill" and candidate.size==Vector2i(96,64) and candidate.layers.size()==7:
			for palette in candidate.palettes.values():
				if JSON.parse_string(palette.serialize()).colors.size()==14:
					template_palette=palette
			if candidate.animation_tags.size()>0:
				template_tag=candidate.animation_tags[0]
	if template_palette==null or template_tag==null:
		return {"error":"Approved14-swatch palette/static tag template unavailable"}
	var palette_copy=template_palette.duplicate()
	target.palettes.clear()
	target.palettes["Kitchen counters - steel rose chrome"]=palette_copy
	target.fps=1.0
	target.frames[0].duration=1.0
	var tag=template_tag.get_script().new("kitchen-counter-static",Color("#c94d7b"),1,1)
	target.animation_tags.assign([tag])
	var composite=blend(target,[0,1,2,3])
	if project==target and image is Image:
		image.copy_from(target.get_current_cel().get_image())
	var output_dir=str(params.output_dir)
	DirAccess.make_dir_recursive_absolute(output_dir)
	var outputs={}
	for item in params.modules:
		var area=Rect2i(int(item.rect[0]),int(item.rect[1]),int(item.rect[2]),int(item.rect[3]))
		var cut=composite.get_region(area)
		outputs[item.id]=cut.save_png(output_dir.path_join(str(item.id)+".png"))
	composite.save_png(output_dir.path_join("kitchen-counter-atlas.png"))
	var saved=Engine.get_main_loop().root.get_node("OpenSave").call("save_pxo_file",str(params.source_dir).path_join("kitchen-counter-kit.pxo"),false,target)
	return {"savedNative":saved,"project":target.name,"size":str(target.size),"layers":target.layers.size(),"paletteSwatches":14,"outputs":outputs,"activeProjectUnchanged":Engine.get_main_loop().root.get_node("Global").get("current_project")==active_before}


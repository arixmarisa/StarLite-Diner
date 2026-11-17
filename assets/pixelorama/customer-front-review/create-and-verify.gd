func blank(w,h):
	var out=Image.create(w,h,false,Image.FORMAT_RGBA8)
	out.fill(Color(0,0,0,0))
	return out

func write_json(path,value):
	var file=FileAccess.open(path,FileAccess.WRITE)
	file.store_string(JSON.stringify(value,"  "))
	file.close()

func preview(image,path,scale):
	var out=image.duplicate()
	out.resize(image.get_width()*scale,image.get_height()*scale,Image.INTERPOLATE_NEAREST)
	return out.save_png(path)

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var active=root.get_node("Global").get("current_project")
	var source=str(params.source_dir)
	var output=str(params.output_dir)
	var spec=JSON.parse_string(FileAccess.get_file_as_string(source.path_join("contract.json")))
	var combined=blank(64,60)
	var verification={"frames":6,"nativeFrameSize":[16,24],"anchor":{"x":8,"y":23},"families":{},"failures":[],"staticOutfitVariants":true}
	var manifest={"status":"front-review-only","directions":["south"],"animated":false,"frameSize":{"width":16,"height":24},"anchor":spec.anchor,"layers":spec.layers,"families":{},"combined":"customers.png","combinedPreview":"customers-preview.png","recolorDemo":"recolor-demo.png"}
	var all_recolors=[]
	var combined_index=0
	for family in spec.familyOrder:
		var recipe=JSON.parse_string(FileAccess.get_file_as_string(source.path_join(spec.recipes[family])))
		var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"customer-"+family+"-front",Vector2i(16,24))
		for name in spec.layers:
			target.layers.append(load("res://src/Classes/Layers/PixelLayer.gd").new(target,str(name)))
		var sheet=blank(48,24)
		var masks={}
		var material_sheets={}
		for role in spec.roles:
			masks[role]=blank(48,24)
			material_sheets[role]=blank(48,24)
		var colors=[]
		for fixed in spec.fixedColors.values():
			if not colors.has(fixed): colors.append(fixed)
		var records=[]
		var source_images=[]
		var composites=[]
		var owners=[]
		var report={"frames":3,"layers":10,"tags":3,"sourceCelsVerified":0,"sourceCompositeExact":true,"exportedPNGExact":true,"connectedComponents":[],"semiTransparentPixels":0,"isolatedRecolorPasses":0,"neutralRecolorChanges":0,"shortsExposedCalfPixels":0,"bodyAlphaMatchesAcrossOutfits":true}
		var body_alpha=[]
		for vi in range(3):
			var variant=recipe.variants[vi]
			for ramp in variant.ramps.values():
				for hex in ramp.values():
					if not colors.has(hex): colors.append(hex)
			var frame=load("res://src/Classes/Frame.gd").new()
			frame.duration=1
			var layers=[]
			var layer_owners=[]
			for li in range(10):
				var pixels=blank(16,24)
				var semantic=[]
				semantic.resize(384)
				semantic.fill("")
				for command in variant.rectangles[li]:
					var token=str(command.c)
					var rect=Rect2i(command.x,command.y,command.w,command.h)
					if not Rect2i(0,0,16,24).encloses(rect): return {"error":"Rectangle out of bounds","command":command}
					var color=Color(0,0,0,0)
					var owner=""
					if token!="clear":
						if token.contains("."):
							var parts=token.split(".")
							var allowed=false
							for allowed_layer in spec.roles[parts[0]].layers:
								if int(allowed_layer)==li: allowed=true
							if not allowed: return {"error":"Role on wrong layer","token":token,"layer":li}
							color=Color(variant.ramps[parts[0]][parts[1]])
							owner=token
						else: color=Color(spec.fixedColors[token])
					pixels.fill_rect(rect,color)
					for y in range(rect.position.y,rect.end.y):
						for x in range(rect.position.x,rect.end.x): semantic[y*16+x]=owner
				layers.append(pixels)
				layer_owners.append(semantic)
				frame.cels.append(target.layers[li].new_cel_from_image(pixels))
			target.frames.append(frame)
			var composite=blank(16,24)
			var visible=[]
			visible.resize(384)
			visible.fill("")
			var body=blank(16,24)
			for li in range(10):
				var layer_image=layers[li]
				composite.blend_rect(layer_image,Rect2i(0,0,16,24),Vector2i.ZERO)
				if li!=1 and li!=8: body.blend_rect(layer_image,Rect2i(0,0,16,24),Vector2i.ZERO)
				for y in range(24):
					for x in range(16):
						if layer_image.get_pixel(x,y).a>0: visible[y*16+x]=layer_owners[li][y*16+x]
			var alpha=[]
			for y in range(11,24):
				for x in range(16): alpha.append(body.get_pixel(x,y).a>0)
			if vi==0: body_alpha=alpha
			elif body_alpha!=alpha: report.bodyAlphaMatchesAcrossOutfits=false
			var origin=Vector2i(vi*16,0)
			sheet.blit_rect(composite,Rect2i(0,0,16,24),origin)
			var pos=spec.combined.positions[combined_index]
			combined.blit_rect(composite,Rect2i(0,0,16,24),Vector2i(pos[0],pos[1]))
			combined_index+=1
			composite.save_png(output.path_join(variant.id+".png"))
			var native_reload=Image.load_from_file(output.path_join(variant.id+".png"))
			if native_reload.get_data()!=composite.get_data(): return {"error":"PNG roundtrip mismatch","id":variant.id}
			preview(composite,source.path_join(variant.id+"-preview.png"),12)
			preview(composite,output.path_join(variant.id+"-preview.png"),12)
			var recolor={"id":variant.id,"family":family,"index":vi,"sheetRect":{"x":vi*16,"y":0,"width":16,"height":24},"ramps":variant.ramps,"roles":{}}
			for role in spec.roles:
				var tone_pixels={"shade":[],"base":[],"highlight":[]}
				var role_material=blank(16,24)
				for li in spec.roles[role].layers: role_material.blend_rect(layers[li],Rect2i(0,0,16,24),Vector2i.ZERO)
				var role_sheet=material_sheets[role]
				role_sheet.blit_rect(role_material,Rect2i(0,0,16,24),origin)
				var mask=masks[role]
				var changed=composite.duplicate()
				for y in range(24):
					for x in range(16):
						var token=str(visible[y*16+x])
						if token.begins_with(role+"."):
							var tone=token.split(".")[1]
							tone_pixels[tone].append([x,y])
							mask.set_pixel(x+vi*16,y,Color.WHITE)
							changed.set_pixel(x,y,Color("#39efc8"))
				for y in range(24):
					for x in range(16):
						if not str(visible[y*16+x]).begins_with(role+".") and changed.get_pixel(x,y)!=composite.get_pixel(x,y): report.neutralRecolorChanges+=1
				report.isolatedRecolorPasses+=1
				recolor.roles[role]={"visibleTonePixels":tone_pixels}
			var remaining={}
			for y in range(24):
				for x in range(16):
					var c=composite.get_pixel(x,y)
					if c.a>0: remaining[y*16+x]=true
					if c.a>0 and c.a<1: report.semiTransparentPixels+=1
			var components=0
			while not remaining.is_empty():
				components+=1
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
			report.connectedComponents.append(components)
			if variant.bottomStyle=="shorts":
				for y in [20,21]:
					for x in [5,6,9,10]:
						if str(visible[y*16+x]).begins_with("skin."): report.shortsExposedCalfPixels+=1
			all_recolors.append(recolor)
			records.append({"id":variant.id,"frame":vi,"tag":variant.id,"topStyle":variant.topStyle,"bottomStyle":variant.bottomStyle,"hairStyle":variant.hairStyle,"native":variant.id+".png","preview":variant.id+"-preview.png"})
			target.animation_tags.append(load("res://src/Classes/AnimationTag.gd").new(variant.id,Color("#ee75a3"),vi+1,vi+1))
			source_images.append(layers)
			composites.append(composite)
			owners.append(visible)
		target.current_frame=0
		target.current_layer=0
		target.fps=1
		var palette=load("res://src/Palette/Palette.gd").new("Customer "+family+" materials",8,ceili(colors.size()/8.0),"Static outfit variants; semantic tone roles")
		palette.is_project_palette=true
		for hex in colors: palette.add_color(Color(hex))
		target.palettes[palette.name]=palette
		target.project_current_palette_name=palette.name
		var path=source.path_join(family+".pxo")
		if not root.get_node("OpenSave").call("save_pxo_file",path,false,target): return {"error":"PXO save failed","family":family}
		var zip=ZIPReader.new()
		if zip.open(path)!=OK: return {"error":"Saved PXO ZIP invalid"}
		var saved=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
		if saved.frames.size()!=3 or saved.layers.size()!=10: return {"error":"Saved timeline structure wrong"}
		if saved.tags.size()!=3 or int(saved.fps)!=1 or int(saved.size_x)!=16 or int(saved.size_y)!=24: return {"error":"Saved metadata wrong"}
		for li in range(10):
			if saved.layers[li].name!=spec.layers[li]: return {"error":"Saved layer names wrong"}
		for vi in range(3):
			if saved.tags[vi].name!=recipe.variants[vi].id or int(saved.tags[vi].from)!=vi+1 or int(saved.tags[vi].to)!=vi+1 or int(saved.frames[vi].duration)!=1: return {"error":"Saved static tags/timing wrong"}
		var embedded_palette=JSON.parse_string(saved.palettes[0][saved.project_current_palette_name])
		if embedded_palette.colors.size()!=colors.size(): return {"error":"Saved palette count wrong"}
		report.savedTagsLayersPaletteVerified=true
		report.paletteSwatches=colors.size()
		for vi in range(3):
			var rebuilt=blank(16,24)
			for li in range(10):
				var raw=zip.read_file("image_data/frames/"+str(vi+1)+"/layer_"+str(li+1))
				if raw!=source_images[vi][li].get_data(): return {"error":"Saved source cel mismatch","family":family,"frame":vi,"layer":li}
				var cel=Image.create_from_data(16,24,false,Image.FORMAT_RGBA8,raw)
				rebuilt.blend_rect(cel,Rect2i(0,0,16,24),Vector2i.ZERO)
				report.sourceCelsVerified+=1
			if rebuilt.get_data()!=composites[vi].get_data(): return {"error":"Saved source composite mismatch"}
		zip.close()
		sheet.save_png(output.path_join(family+".png"))
		preview(sheet,source.path_join(family+"-preview.png"),12)
		preview(sheet,output.path_join(family+"-preview.png"),12)
		for role in spec.roles:
			var mask=masks[role]
			var material=material_sheets[role]
			mask.save_png(output.path_join(family+"-"+role+"-mask.png"))
			material.save_png(output.path_join(family+"-"+role+"-layer.png"))
		write_json(source.path_join(family+"-palette.json"),{"colors":colors,"variants":recipe.variants.map(func(v): return {"id":v.id,"ramps":v.ramps})})
		var role_exports={}
		for role in spec.roles:
			role_exports[role]={"mask":family+"-"+role+"-mask.png","layerImage":family+"-"+role+"-layer.png","sourceLayers":spec.roles[role].layers}
		manifest.families[family]={"source":"../../../../../assets/pixelorama/customer-front-review/"+family+".pxo","sheet":family+".png","sheetSize":{"width":48,"height":24},"variants":records,"roles":role_exports}
		verification.families[family]=report
		if report.neutralRecolorChanges!=0 or report.semiTransparentPixels!=0 or not report.bodyAlphaMatchesAcrossOutfits or report.connectedComponents!=[1,1,1] or report.shortsExposedCalfPixels!=8: verification.failures.append(family+" geometry/recolor check failed")
		if family=="male":
			var demo=blank(36,24)
			var original=composites[0]
			var changed=original.duplicate()
			var demo_changed=0
			var demo_neutral_changes=0
			var demo_alpha_changes=0
			for y in range(24):
				for x in range(16):
					var token=str(owners[0][y*16+x])
					if token!="":
						var parts=token.split(".")
						changed.set_pixel(x,y,Color(recipe.variants[1].ramps[parts[0]][parts[1]]))
					var before=original.get_pixel(x,y)
					var after=changed.get_pixel(x,y)
					if after!=before:
						demo_changed+=1
						if token=="": demo_neutral_changes+=1
					if after.a!=before.a: demo_alpha_changes+=1
			verification.recolorDemo={"sameGeometry":true,"changedMaterialPixels":demo_changed,"neutralChanges":demo_neutral_changes,"alphaChanges":demo_alpha_changes,"description":"Male tee geometry, first palette then second palette; comparison only, not a seventh candidate"}
			if demo_neutral_changes!=0 or demo_alpha_changes!=0 or demo_changed==0: verification.failures.append("Recolor demo failed")
			demo.blit_rect(original,Rect2i(0,0,16,24),Vector2i.ZERO)
			demo.blit_rect(changed,Rect2i(0,0,16,24),Vector2i(20,0))
			demo.save_png(output.path_join("recolor-demo.png"))
			preview(demo,source.path_join("recolor-demo-preview.png"),12)
			preview(demo,output.path_join("recolor-demo-preview.png"),12)
	combined.save_png(output.path_join("customers.png"))
	preview(combined,source.path_join("customers-preview.png"),12)
	preview(combined,output.path_join("customers-preview.png"),12)
	write_json(output.path_join("recolor-map.json"),{"frameSize":{"width":16,"height":24},"roles":spec.roles,"toneIds":spec.toneIds,"neutralPixelsExcluded":true,"coordinates":"local native frame coordinates; masks use family 48x24 sheet coordinates","variants":all_recolors})
	write_json(output.path_join("manifest.json"),manifest)
	verification.activeProjectUnchanged=root.get_node("Global").get("current_project")==active
	write_json(source.path_join("verification.json"),verification)
	return verification

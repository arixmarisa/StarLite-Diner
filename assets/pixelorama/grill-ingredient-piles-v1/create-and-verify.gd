const W=24
const H=12
const NAMES=["01 - compact contact shadows","02 - layered raw meat contours","03 - raw meat rose light and shade","04 - compact stainless batter bowl","05 - cream pancake batter","06 - connected steel ladle"]
const ITEMS=["patty-stack","sausage-pile","pancake-batter"]

func qa(pic,allowed):
	var opaque=0
	var semi=0
	var invalid=0
	var orphans=0
	var colors={}
	for yy in range(pic.get_height()):
		for xx in range(pic.get_width()):
			var color=pic.get_pixel(xx,yy)
			if color.a==0:
				continue
			opaque+=1
			if color.a!=1:
				semi+=1
			if not allowed.has(color.to_html()):
				invalid+=1
			colors[color.to_html()]=true
			var connected=false
			for dy in [-1,0,1]:
				for dx in [-1,0,1]:
					var x=xx+dx
					var y=yy+dy
					if (dx!=0 or dy!=0) and x>=0 and x<pic.get_width() and y>=0 and y<pic.get_height() and pic.get_pixel(x,y).a>0:
						connected=true
			if not connected:
				orphans+=1
	var bounds=pic.get_used_rect()
	return {"opaquePixels":opaque,"semitransparentPixels":semi,"outOfPalettePixels":invalid,"orphanPixels":orphans,"visibleColors":colors.size(),"occupiedBounds":{"x":bounds.position.x,"y":bounds.position.y,"width":bounds.size.x,"height":bounds.size.y}}

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var global=root.get_node("Global")
	var active=global.get("current_project")
	var active_data=active.frames[active.current_frame].cels[active.current_layer].get_image().get_data()
	var source_dir=str(params.source_dir)
	var output_dir=str(params.output_dir)
	var tag_script=null
	for candidate in global.get("projects"):
		if candidate.animation_tags.size()>0:
			tag_script=candidate.animation_tags[0].get_script()
			break
	if tag_script==null:
		return {"error":"Native tag class unavailable"}
	var swatches=JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("palette.json")))
	var allowed={}
	var palette=load("res://src/Palette/Palette.gd").new("Existing kitchen ingredient colors",7,2,"Approved14-swatch diner palette")
	palette.is_project_palette=true
	for swatch in swatches.colors:
		palette.add_color(Color(str(swatch.hex)))
		allowed[Color(str(swatch.hex)).to_html()]=true
	var recipe=GDScript.new()
	recipe.source_code="extends RefCounted\n"+FileAccess.get_file_as_string(source_dir.path_join("draw.gd"))
	if recipe.reload()!=OK:
		return {"error":"Drawing recipe compilation failed"}
	var drawer=recipe.new()
	var target=load("res://src/Classes/Project.gd").new(Array([],TYPE_OBJECT,"RefCounted",load("res://src/Classes/Frame.gd")),"grill-ingredient-piles-v1",Vector2i(W,H))
	var frame=load("res://src/Classes/Frame.gd").new()
	var complete=Image.create(W,H,false,Image.FORMAT_RGBA8)
	complete.fill(Color.TRANSPARENT)
	for index in range(NAMES.size()):
		var picture=drawer.call("run",null,null,target,{"role":index})
		var layer=load("res://src/Classes/Layers/PixelLayer.gd").new(target,NAMES[index])
		target.layers.append(layer)
		frame.cels.append(layer.new_cel_from_image(picture))
		complete.blend_rect(picture,Rect2i(0,0,W,H),Vector2i.ZERO)
	target.frames.append(frame)
	target.fps=1
	target.current_frame=0
	target.current_layer=0
	frame.duration=1.0
	target.palettes.clear()
	target.palettes["Existing kitchen ingredient colors"]=palette
	target.project_current_palette_name="Existing kitchen ingredient colors"
	target.animation_tags.append(tag_script.new("grill-ingredient-piles-static",Color("#ee75a3"),1,1))
	var saved=root.get_node("OpenSave").call("save_pxo_file",source_dir.path_join("ingredient-piles.pxo"),false,target)
	if not saved:
		return {"error":"Explicit target save failed"}
	complete.save_png(output_dir.path_join("ingredient-piles-atlas.png"))
	var sprites={}
	for i in range(3):
		var sprite=complete.get_region(Rect2i(i*8,0,8,12))
		sprite.save_png(output_dir.path_join(ITEMS[i]+".png"))
		sprites[ITEMS[i]]=qa(sprite,allowed)
		sprites[ITEMS[i]]["sourceCropMatchesPng"]=sprite.get_data()==Image.load_from_file(output_dir.path_join(ITEMS[i]+".png")).get_data()
		if sprites[ITEMS[i]].occupiedBounds.x<1 or sprites[ITEMS[i]].occupiedBounds.x+sprites[ITEMS[i]].occupiedBounds.width>7:
			return {"error":"Ingredient exceeds six-pixel tray interior","item":ITEMS[i]}
	var preview=complete.duplicate()
	preview.resize(W*10,H*10,Image.INTERPOLATE_NEAREST)
	preview.save_png(source_dir.path_join("ingredient-piles-preview.png"))
	preview.save_png(output_dir.path_join("ingredient-piles-preview.png"))
	var zip=ZIPReader.new()
	if zip.open(source_dir.path_join("ingredient-piles.pxo"))!=OK:
		return {"error":"Cannot independently reopen source"}
	var data=JSON.parse_string(zip.read_file("data.json").get_string_from_utf8())
	var rebuilt=Image.create(W,H,false,Image.FORMAT_RGBA8)
	rebuilt.fill(Color.TRANSPARENT)
	var cel_checks=[]
	for index in range(NAMES.size()):
		var raw=zip.read_file("image_data/frames/1/layer_"+str(index+1))
		if raw.size()!=W*H*4:
			return {"error":"Saved cel byte length differs","layer":index}
		cel_checks.append(raw==frame.cels[index].get_image().get_data())
		rebuilt.blend_rect(Image.create_from_data(W,H,false,Image.FORMAT_RGBA8,raw),Rect2i(0,0,W,H),Vector2i.ZERO)
	zip.close()
	var result={"sourceSize":[data.size_x,data.size_y],"layers":data.layers.size(),"paletteSwatches":swatches.colors.size(),"frames":data.frames.size(),"fps":data.fps,"tag":data.tags[0].name,"savedSourceMatchesAtlas":rebuilt.get_data()==complete.get_data(),"savedCelMatches":cel_checks,"sprites":sprites,"atlas":qa(complete,allowed),"illustratedQuantities":[3,3,1],"activeProjectUnchanged":global.get("current_project")==active,"foreignActiveCelUnchanged":active_data==active.frames[active.current_frame].cels[active.current_layer].get_image().get_data()}
	var file=FileAccess.open(output_dir.path_join("verification.json"),FileAccess.WRITE)
	file.store_string(JSON.stringify(result,"  ")+"\n")
	file.close()
	return result

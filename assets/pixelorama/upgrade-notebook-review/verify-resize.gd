func blank(width,height):
	var output=Image.create(width,height,false,Image.FORMAT_RGBA8)
	output.fill(Color(0,0,0,0))
	return output

func same_region(first, first_rect, second, second_rect):
	return first.get_region(first_rect).get_data()==second.get_region(second_rect).get_data()

func run(api,image,project,params):
	var source_dir=str(params.source_dir)
	var output_dir=str(params.output_dir)
	var spec=JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("components.json")))
	var manifest=JSON.parse_string(FileAccess.get_file_as_string(output_dir.path_join("manifest.json")))
	var recipe=GDScript.new()
	recipe.source_code="extends RefCounted\n"+FileAccess.get_file_as_string(source_dir.path_join("create-and-verify.gd"))
	if recipe.reload()!=OK:
		return {"error":"Resize recipe compile failed"}
	var drawer=recipe.new()
	var atlas=Image.load_from_file(output_dir.path_join("upgrade-ui-atlas.png"))
	var checks={}
	for component in manifest.components:
		var source=Image.load_from_file(output_dir.path_join(str(component.image)))
		var region=component.sourceRect
		var entry={"sourceCropMatches":same_region(atlas,Rect2i(int(region.x),int(region.y),int(region.width),int(region.height)),source,Rect2i(Vector2i.ZERO,source.get_size()))}
		if component.resize.method=="nine-slice":
			var margins=component.resize.margins
			var left=int(margins.left)
			var top=int(margins.top)
			var right=int(margins.right)
			var bottom=int(margins.bottom)
			var native_identity=drawer.call("tile_nine",source,source.get_width(),source.get_height(),margins)
			entry["nativeIdentity"]=native_identity.get_data()==source.get_data()
			var sizes=[[int(component.resize.minSize.width),int(component.resize.minSize.height)],[source.get_width()+37,source.get_height()+23],[source.get_width()*2+3,source.get_height()+17]]
			var variants=[]
			for size in sizes:
				var width=int(size[0])
				var height=int(size[1])
				var resized=drawer.call("tile_nine",source,width,height,margins)
				var corners=true
				for pair in [[Rect2i(0,0,left,top),Rect2i(0,0,left,top)],[Rect2i(source.get_width()-right,0,right,top),Rect2i(width-right,0,right,top)],[Rect2i(0,source.get_height()-bottom,left,bottom),Rect2i(0,height-bottom,left,bottom)],[Rect2i(source.get_width()-right,source.get_height()-bottom,right,bottom),Rect2i(width-right,height-bottom,right,bottom)]]:
					corners=corners and same_region(source,pair[0],resized,pair[1])
				var content=component.contentInsets
				var interior=Rect2i(int(content.left),int(content.top),width-int(content.left)-int(content.right),height-int(content.top)-int(content.bottom))
				var clear=drawer.call("alpha_clear",resized,interior)
				variants.append({"size":size,"cornersUnchanged":corners,"contentTransparent":clear})
			entry["resizeCases"]=variants
			var edges_match=true
			for yy in range(source.get_height()):
				if yy<top or yy>=source.get_height()-bottom:
					edges_match=edges_match and source.get_pixel(left,yy)==source.get_pixel(source.get_width()-right-1,yy)
			for xx in range(source.get_width()):
				if xx<left or xx>=source.get_width()-right:
					edges_match=edges_match and source.get_pixel(xx,top)==source.get_pixel(xx,source.get_height()-bottom-1)
			entry["repeatBoundaryProfilesMatch"]=edges_match
		checks[component.id]=entry
	var previous=JSON.parse_string(FileAccess.get_file_as_string(output_dir.path_join("verification.json")))
	previous["resizeContractChecks"]=checks
	var report=FileAccess.open(output_dir.path_join("verification.json"),FileAccess.WRITE)
	report.store_string(JSON.stringify(previous,"  ")+"\n")
	report.close()
	return checks


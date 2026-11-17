func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var active=root.get_node("Global").get("current_project")
	var source=str(params.source_dir)
	var output=str(params.output_dir)
	var sheets=[]
	var reports={}
	var combined_frames=[]
	for family in ["male","female"]:
		var sheet=Image.load_from_file(output.path_join(family+".png"))
		if sheet.get_size()!=Vector2i(96,288): return {"error":"Wrong native sheet"}
		sheets.append(sheet)
		var frames=[]
		for phase in range(4):
			var display=blank(64,72)
			for outfit in range(3):
				for direction in range(4):
					display.blit_rect(sheet,Rect2i((phase+1)*16,(outfit*4+direction)*24,16,24),Vector2i(direction*16,outfit*24))
			display.resize(512,576,Image.INTERPOLATE_NEAREST)
			frames.append(display)
		reports[family]=save_apng(frames,source.path_join(family+"-motion-preview.png"))
		save_apng(frames,output.path_join(family+"-motion-preview.png"))
		for outfit in range(3):
			var outfit_frames=[]
			for phase in range(4): outfit_frames.append(frames[phase].get_region(Rect2i(0,outfit*192,512,192)))
			save_apng(outfit_frames,output.path_join(family+"-outfit-"+str(outfit+1)+"-motion-preview.png"))
	for phase in range(4):
		var display=blank(128,72)
		for base in range(2):
			for outfit in range(3):
				for direction in range(4):
					display.blit_rect(sheets[base],Rect2i((phase+1)*16,(outfit*4+direction)*24,16,24),Vector2i(base*64+direction*16,outfit*24))
		display.resize(768,432,Image.INTERPOLATE_NEAREST)
		combined_frames.append(display)
	reports.combined=save_apng(combined_frames,source.path_join("customers-motion-preview.png"))
	save_apng(combined_frames,output.path_join("customers-motion-preview.png"))
	reports.activeProjectUnchanged=root.get_node("Global").get("current_project")==active
	return reports
